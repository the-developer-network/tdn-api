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
    ResetPasswordUseCase,
    type ResetPasswordInput,
} from "@core/use-cases/auth/reset-password.usecase";
import { BadRequestError } from "@core/errors/bad-request.error";
import { TokenType } from "@core/entities/verification-token.entity";
import type { IUserRepository } from "@core/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/repositories/verification-token.repository";
import type { AuthTokenPort } from "@core/ports/auth-token.port";
import type { OtpPort } from "@core/ports/otp.port";
import type { PasswordService } from "@infrastructure/services/password.service";

describe("Reset Password Use Case", () => {
    let resetPasswordUseCase: ResetPasswordUseCase;
    let mockUserRepository: Mocked<IUserRepository>;
    let mockVerificationTokenRepository: Mocked<IVerificationTokenRepository>;
    let mockTokenPort: Mocked<AuthTokenPort>;
    let mockPasswordService: Mocked<PasswordService>;
    let mockOtpPort: Mocked<OtpPort>;

    let validRequest: ResetPasswordInput;
    let mockUser: any;
    let mockVerificationToken: any;

    const GENERIC_ERROR_MESSAGE = "Invalid or expired reset credentials.";

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

        mockTokenPort = {
            generate: vi.fn(),
            verify: vi.fn(),
            hashRefreshSecret: vi.fn(),
        };

        mockPasswordService = {
            hash: vi.fn(),
            verify: vi.fn(),
        } as unknown as Mocked<PasswordService>;

        mockOtpPort = {
            generateOtp: vi.fn(),
            hashOtp: vi.fn(),
        };

        resetPasswordUseCase = new ResetPasswordUseCase(
            mockUserRepository,
            mockVerificationTokenRepository,
            mockTokenPort,
            mockPasswordService,
            mockOtpPort,
        );

        validRequest = {
            email: "user@example.com",
            otp: "123456",
            newPassword: "NewSecurePassword123!",
        };

        mockUser = {
            id: "user-123",
            email: "user@example.com",
            isDeleted: vi.fn().mockReturnValue(false),
            set hashPassword(val: string) {
                this._passwordHash = val;
            },
            _passwordHash: "old_hash",
        };

        mockVerificationToken = {
            id: "token-456",
            userId: "user-123",
            tokenHash: "hashed_otp_123456",
            isExpired: vi.fn().mockReturnValue(false),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should successfully reset the password, update the user, and delete the token.", async () => {
            /** Arrange */
            const newPasswordHashed = "new_hashed_password_string";

            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            mockVerificationTokenRepository.findByUserIdAndType.mockResolvedValue(
                mockVerificationToken,
            );
            mockOtpPort.hashOtp.mockReturnValue("hashed_otp_123456"); // Matches mockVerificationToken.tokenHash
            mockPasswordService.hash.mockResolvedValue(newPasswordHashed);

            /** Act */
            await resetPasswordUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
                validRequest.email,
            );
            expect(
                mockVerificationTokenRepository.findByUserIdAndType,
            ).toHaveBeenCalledWith(mockUser.id, TokenType.PASSWORD_RESET);

            expect(mockOtpPort.hashOtp).toHaveBeenCalledWith(validRequest.otp);
            expect(mockPasswordService.hash).toHaveBeenCalledWith(
                validRequest.newPassword,
            );

            // Verify user entity mutation via setter
            expect(mockUser._passwordHash).toBe(newPasswordHashed);

            // Verify final saves and cleanups
            expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser);
            expect(mockVerificationTokenRepository.delete).toHaveBeenCalledWith(
                mockVerificationToken.id,
            );
        });

        it("Should throw BadRequestError if the user is not found.", async () => {
            /** Arrange */
            mockUserRepository.findByEmail.mockResolvedValue(null);

            /** Act & Assert */
            await expect(
                resetPasswordUseCase.execute(validRequest),
            ).rejects.toThrow(new BadRequestError(GENERIC_ERROR_MESSAGE));
            expect(
                mockVerificationTokenRepository.findByUserIdAndType,
            ).not.toHaveBeenCalled();
        });

        it("Should throw BadRequestError if the user is marked as deleted.", async () => {
            /** Arrange */
            mockUser.isDeleted.mockReturnValue(true);
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);

            /** Act & Assert */
            await expect(
                resetPasswordUseCase.execute(validRequest),
            ).rejects.toThrow(new BadRequestError(GENERIC_ERROR_MESSAGE));
            expect(
                mockVerificationTokenRepository.findByUserIdAndType,
            ).not.toHaveBeenCalled();
        });

        it("Should throw BadRequestError if the verification token is not found.", async () => {
            /** Arrange */
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            mockVerificationTokenRepository.findByUserIdAndType.mockResolvedValue(
                null,
            );

            /** Act & Assert */
            await expect(
                resetPasswordUseCase.execute(validRequest),
            ).rejects.toThrow(new BadRequestError(GENERIC_ERROR_MESSAGE));
            expect(mockOtpPort.hashOtp).not.toHaveBeenCalled();
        });

        it("Should throw BadRequestError if the verification token is expired.", async () => {
            /** Arrange */
            mockVerificationToken.isExpired.mockReturnValue(true);

            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            mockVerificationTokenRepository.findByUserIdAndType.mockResolvedValue(
                mockVerificationToken,
            );

            /** Act & Assert */
            await expect(
                resetPasswordUseCase.execute(validRequest),
            ).rejects.toThrow(new BadRequestError(GENERIC_ERROR_MESSAGE));
            expect(mockOtpPort.hashOtp).not.toHaveBeenCalled();
        });

        it("Should throw BadRequestError if the OTP does not match the token hash.", async () => {
            /** Arrange */
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            mockVerificationTokenRepository.findByUserIdAndType.mockResolvedValue(
                mockVerificationToken,
            );

            // Provide a mismatched hash
            mockOtpPort.hashOtp.mockReturnValue("wrong_hashed_otp");

            /** Act & Assert */
            await expect(
                resetPasswordUseCase.execute(validRequest),
            ).rejects.toThrow(new BadRequestError(GENERIC_ERROR_MESSAGE));
            expect(mockPasswordService.hash).not.toHaveBeenCalled();
            expect(mockUserRepository.update).not.toHaveBeenCalled();
        });
    });
});
