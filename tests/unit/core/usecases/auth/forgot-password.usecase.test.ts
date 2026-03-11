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
    ForgotPasswordUseCase,
    type ForgotPasswordInput,
} from "@core/use-cases/auth/forgot-password.usecase";
import { TokenType } from "@core/entities/verification-token.entity";
import type { IUserRepository } from "@core/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/repositories/verification-token.repository";
import type { AuthTokenPort } from "@core/ports/auth-token.port";
import type { EmailPort } from "@core/ports/email.port";
import type { OtpPort } from "@core/ports/otp.port";

describe("Forgot Password Use Case", () => {
    let forgotPasswordUseCase: ForgotPasswordUseCase;
    let mockUserRepository: Mocked<IUserRepository>;
    let mockVerificationTokenRepository: Mocked<IVerificationTokenRepository>;
    let mockTokenPort: Mocked<AuthTokenPort>;
    let mockEmailPort: Mocked<EmailPort>;
    let mockOtpPort: Mocked<OtpPort>;

    let validRequest: ForgotPasswordInput;
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

        forgotPasswordUseCase = new ForgotPasswordUseCase(
            mockUserRepository,
            mockVerificationTokenRepository,
            mockTokenPort,
            mockEmailPort,
            mockOtpPort,
        );

        validRequest = {
            email: "test@example.com",
        };

        mockUser = {
            id: "user-123",
            email: "test@example.com",
            isDeleted: vi.fn().mockReturnValue(false),
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should successfully generate an OTP, save the hashed token, and send a reset email.", async () => {
            /** Arrange */
            const plainOtp = "12345678";
            const hashedOtp = "hashed_otp_string";
            // 10 minutes in milliseconds = 10 * 60 * 1000 = 600000
            const expectedExpiration = new Date(SYSTEM_TIME.getTime() + 600000);

            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            mockOtpPort.generateOtp.mockReturnValue(plainOtp);
            mockOtpPort.hashOtp.mockReturnValue(hashedOtp);

            /** Act */
            await forgotPasswordUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
                validRequest.email,
            );

            expect(mockOtpPort.generateOtp).toHaveBeenCalledWith(8);
            expect(mockOtpPort.hashOtp).toHaveBeenCalledWith(plainOtp);

            expect(mockVerificationTokenRepository.upsert).toHaveBeenCalledWith(
                {
                    userId: mockUser.id,
                    tokenHash: hashedOtp,
                    type: TokenType.PASSWORD_RESET,
                    expiresAt: expectedExpiration,
                },
            );

            expect(mockEmailPort.sendPasswordResetEmail).toHaveBeenCalledWith({
                to: mockUser.email,
                otp: plainOtp,
            });
        });

        it("Should return early silently if the user is not found (prevent enumeration attacks).", async () => {
            /** Arrange */
            mockUserRepository.findByEmail.mockResolvedValue(null);

            /** Act */
            await forgotPasswordUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
                validRequest.email,
            );

            // Critical security checks: ensure nothing else is executed
            expect(mockOtpPort.generateOtp).not.toHaveBeenCalled();
            expect(
                mockVerificationTokenRepository.upsert,
            ).not.toHaveBeenCalled();
            expect(mockEmailPort.sendPasswordResetEmail).not.toHaveBeenCalled();
        });

        it("Should return early silently if the user is marked as deleted.", async () => {
            /** Arrange */
            mockUser.isDeleted.mockReturnValue(true);
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);

            /** Act */
            await forgotPasswordUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
                validRequest.email,
            );
            expect(mockUser.isDeleted).toHaveBeenCalledTimes(1);

            // Critical security checks
            expect(mockOtpPort.generateOtp).not.toHaveBeenCalled();
            expect(
                mockVerificationTokenRepository.upsert,
            ).not.toHaveBeenCalled();
            expect(mockEmailPort.sendPasswordResetEmail).not.toHaveBeenCalled();
        });
    });
});
