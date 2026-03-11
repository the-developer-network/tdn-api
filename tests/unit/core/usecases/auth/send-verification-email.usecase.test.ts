import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mocked,
} from "vitest";
import {
    SendVerificationEmailUseCase,
    type SendVerificationEmailInput,
} from "@core/use-cases/auth/send-verification-email.usecase";
import { UnauthorizedError } from "@core/errors/unauthorized.error";
import { TokenType } from "@core/entities/verification-token.entity";
import type { IUserRepository } from "@core/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/repositories/verification-token.repository";
import type { AuthTokenPort } from "@core/ports/auth-token.port";
import type { EmailPort } from "@core/ports/email.port";
import type { OtpPort } from "@core/ports/otp.port";

describe("Send Verification Email Use Case", () => {
    let sendVerificationEmailUseCase: SendVerificationEmailUseCase;
    let mockUserRepository: Mocked<IUserRepository>;
    let mockVerificationTokenRepository: Mocked<IVerificationTokenRepository>;
    let mockTokenPort: Mocked<AuthTokenPort>;
    let mockEmailPort: Mocked<EmailPort>;
    let mockOtpPort: Mocked<OtpPort>;

    let validRequest: SendVerificationEmailInput;
    let mockUser: any;

    const SYSTEM_TIME = new Date("2026-03-10T12:00:00Z");

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(SYSTEM_TIME);

        mockUserRepository = {
            create: vi.fn(),
            findByIdentifier: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            findByEmail: vi.fn(),
        } as unknown as Mocked<IUserRepository>;

        mockVerificationTokenRepository = {
            upsert: vi.fn(),
            findByUserIdAndType: vi.fn(),
            delete: vi.fn(),
        } as unknown as Mocked<IVerificationTokenRepository>;

        mockTokenPort = {
            generate: vi.fn(),
            verify: vi.fn(),
            hashRefreshSecret: vi.fn(),
        };

        mockEmailPort = {
            sendVerificationEmail: vi.fn(),
            sendPasswordResetEmail: vi.fn(),
        };

        mockOtpPort = {
            generateOtp: vi.fn(),
            hashOtp: vi.fn(),
        };

        sendVerificationEmailUseCase = new SendVerificationEmailUseCase(
            mockUserRepository,
            mockVerificationTokenRepository,
            mockTokenPort,
            mockEmailPort,
            mockOtpPort,
        );

        validRequest = {
            userId: "user-123",
        };

        mockUser = {
            id: "user-123",
            email: "test@example.com",
            isDeleted: vi.fn().mockReturnValue(false),
            isEmailVerified: false,
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should generate an OTP, hash it, upsert the token, and send the email.", async () => {
            /** Arrange */
            const plainOtp = "12345678";
            const hashedOtp = "hashed_otp_string";
            const expectedExpiration = new Date(
                SYSTEM_TIME.getTime() + 10 * 60 * 1000,
            );

            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockOtpPort.generateOtp.mockReturnValue(plainOtp);
            mockOtpPort.hashOtp.mockReturnValue(hashedOtp);

            /** Act */
            await sendVerificationEmailUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.findById).toHaveBeenCalledWith(
                validRequest.userId,
            );

            expect(mockOtpPort.generateOtp).toHaveBeenCalledWith(8);
            expect(mockOtpPort.hashOtp).toHaveBeenCalledWith(plainOtp);

            expect(mockVerificationTokenRepository.upsert).toHaveBeenCalledWith(
                {
                    userId: mockUser.id,
                    tokenHash: hashedOtp,
                    type: TokenType.EMAIL_VERIFICATION,
                    expiresAt: expectedExpiration,
                },
            );

            expect(mockEmailPort.sendVerificationEmail).toHaveBeenCalledWith({
                to: mockUser.email,
                otp: plainOtp,
            });
        });

        it("Should return early without doing anything if the user is already verified.", async () => {
            /** Arrange */
            mockUser.isEmailVerified = true;
            mockUserRepository.findById.mockResolvedValue(mockUser);

            /** Act */
            await sendVerificationEmailUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.findById).toHaveBeenCalledWith(
                validRequest.userId,
            );

            // Critical checks: should skip generation, database updates, and emails
            expect(mockOtpPort.generateOtp).not.toHaveBeenCalled();
            expect(
                mockVerificationTokenRepository.upsert,
            ).not.toHaveBeenCalled();
            expect(mockEmailPort.sendVerificationEmail).not.toHaveBeenCalled();
        });

        it("Should throw UnauthorizedError if the user is not found.", async () => {
            /** Arrange */
            mockUserRepository.findById.mockResolvedValue(null);

            /** Act & Assert */
            await expect(
                sendVerificationEmailUseCase.execute(validRequest),
            ).rejects.toThrow(new UnauthorizedError("User not found"));
            expect(mockOtpPort.generateOtp).not.toHaveBeenCalled();
        });

        it("Should throw UnauthorizedError if the user is marked as deleted.", async () => {
            /** Arrange */
            mockUser.isDeleted.mockReturnValue(true);
            mockUserRepository.findById.mockResolvedValue(mockUser);

            /** Act & Assert */
            await expect(
                sendVerificationEmailUseCase.execute(validRequest),
            ).rejects.toThrow(new UnauthorizedError("User not found"));
            expect(mockOtpPort.generateOtp).not.toHaveBeenCalled();
        });
    });
});
