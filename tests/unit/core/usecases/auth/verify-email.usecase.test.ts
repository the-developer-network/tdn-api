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
    VerifyEmailUseCase,
    type VerifyEmailInput,
} from "@core/use-cases/auth/verify-email.usecase";
import { BadRequestError } from "@core/errors/bad-request.error";
import { UnauthorizedError } from "@core/errors/unauthorized.error";
import { TokenType } from "@core/entities/verification-token.entity";
import type { IUserRepository } from "@core/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/repositories/verification-token.repository";
import type { OtpPort } from "@core/ports/otp.port";

describe("Verify Email Use Case", () => {
    let verifyEmailUseCase: VerifyEmailUseCase;
    let mockUserRepository: Mocked<IUserRepository>;
    let mockVerificationTokenRepository: Mocked<IVerificationTokenRepository>;
    let mockOtpPort: Mocked<OtpPort>;

    let validRequest: VerifyEmailInput;
    let mockUser: any;
    let mockVerificationToken: any;

    beforeEach(() => {
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

        mockOtpPort = {
            generateOtp: vi.fn(),
            hashOtp: vi.fn(),
        };

        verifyEmailUseCase = new VerifyEmailUseCase(
            mockUserRepository,
            mockVerificationTokenRepository,
            mockOtpPort,
        );

        validRequest = {
            userId: "user-123",
            otp: "12345678",
        };

        mockUser = {
            id: "user-123",
            isDeleted: vi.fn().mockReturnValue(false),
            isEmailVerified: false,
            verifyEmail: vi.fn(),
        };

        mockVerificationToken = {
            id: "token-789",
            tokenHash: "hashed_otp_string",
            isExpired: vi.fn().mockReturnValue(false),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should successfully verify the email, update the user, and delete the token.", async () => {
            /** Arrange */
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockVerificationTokenRepository.findByUserIdAndType.mockResolvedValue(
                mockVerificationToken,
            );
            mockOtpPort.hashOtp.mockReturnValue("hashed_otp_string");

            /** Act */
            await verifyEmailUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.findById).toHaveBeenCalledWith(
                validRequest.userId,
            );

            expect(
                mockVerificationTokenRepository.findByUserIdAndType,
            ).toHaveBeenCalledWith(mockUser.id, TokenType.EMAIL_VERIFICATION);

            expect(mockOtpPort.hashOtp).toHaveBeenCalledWith(validRequest.otp);

            expect(mockUser.verifyEmail).toHaveBeenCalledTimes(1);
            expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser);
            expect(mockVerificationTokenRepository.delete).toHaveBeenCalledWith(
                mockVerificationToken.id,
            );
        });

        it("Should return early without doing anything if the user is already verified.", async () => {
            /** Arrange */
            mockUser.isEmailVerified = true;
            mockUserRepository.findById.mockResolvedValue(mockUser);

            /** Act */
            await verifyEmailUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.findById).toHaveBeenCalledWith(
                validRequest.userId,
            );

            expect(
                mockVerificationTokenRepository.findByUserIdAndType,
            ).not.toHaveBeenCalled();
            expect(mockUser.verifyEmail).not.toHaveBeenCalled();
            expect(mockUserRepository.update).not.toHaveBeenCalled();
            expect(
                mockVerificationTokenRepository.delete,
            ).not.toHaveBeenCalled();
        });

        it("Should throw UnauthorizedError if the user is not found.", async () => {
            /** Arrange */
            mockUserRepository.findById.mockResolvedValue(null);

            /** Act & Assert */
            await expect(
                verifyEmailUseCase.execute(validRequest),
            ).rejects.toThrow(new UnauthorizedError("Unauthorized access."));
            expect(
                mockVerificationTokenRepository.findByUserIdAndType,
            ).not.toHaveBeenCalled();
        });

        it("Should throw UnauthorizedError if the user is marked as deleted.", async () => {
            /** Arrange */
            mockUser.isDeleted.mockReturnValue(true);
            mockUserRepository.findById.mockResolvedValue(mockUser);

            /** Act & Assert */
            await expect(
                verifyEmailUseCase.execute(validRequest),
            ).rejects.toThrow(new UnauthorizedError("Unauthorized access."));
            expect(
                mockVerificationTokenRepository.findByUserIdAndType,
            ).not.toHaveBeenCalled();
        });

        it("Should throw BadRequestError if the verification token is not found.", async () => {
            /** Arrange */
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockVerificationTokenRepository.findByUserIdAndType.mockResolvedValue(
                null,
            );

            /** Act & Assert */
            await expect(
                verifyEmailUseCase.execute(validRequest),
            ).rejects.toThrow(
                new BadRequestError("Invalid verification code."),
            );
            expect(mockOtpPort.hashOtp).not.toHaveBeenCalled();
        });

        it("Should throw BadRequestError if the verification token is expired.", async () => {
            /** Arrange */
            mockVerificationToken.isExpired.mockReturnValue(true);

            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockVerificationTokenRepository.findByUserIdAndType.mockResolvedValue(
                mockVerificationToken,
            );

            /** Act & Assert */
            await expect(
                verifyEmailUseCase.execute(validRequest),
            ).rejects.toThrow(
                new BadRequestError(
                    "Verification code has expired. Please request a new one.",
                ),
            );
            expect(mockOtpPort.hashOtp).not.toHaveBeenCalled();
        });

        it("Should throw BadRequestError if the OTP does not match the token hash.", async () => {
            /** Arrange */
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockVerificationTokenRepository.findByUserIdAndType.mockResolvedValue(
                mockVerificationToken,
            );

            mockOtpPort.hashOtp.mockReturnValue("wrong_hash_mismatch");

            /** Act & Assert */
            await expect(
                verifyEmailUseCase.execute(validRequest),
            ).rejects.toThrow(
                new BadRequestError("Invalid verification code."),
            );
            expect(mockUser.verifyEmail).not.toHaveBeenCalled();
            expect(mockUserRepository.update).not.toHaveBeenCalled();
        });
    });
});
