import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/ports/repositories/verification-token.repository";
import type { EmailPort } from "@core/ports/services/email.port";
import { TokenType } from "@core/domain/enums/token-type.enum";
import type { CryptoPort } from "@core/ports/services/crypto.port";
import type { ForgotPasswordInput } from "./forgot-password.input";

/**
 * Use case for handling password reset requests.
 *
 * This use case manages the process of initiating a password reset for a user
 * by generating a verification token and sending a reset email.
 */
export class ForgotPasswordUseCase {
    /**
     * Creates a new instance of ForgotPasswordUseCase.
     *
     * @param userRepository - Repository for managing user data
     * @param verificationTokenRepository - Repository for managing verification tokens
     * @param emailService - Service for sending emails
     * @param cryptoService - Service for cryptographic operations
     */
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly verificationTokenRepository: IVerificationTokenRepository,
        private readonly emailService: EmailPort,
        private readonly cryptoService: CryptoPort,
        private readonly otpExpirySeconds: number = 10 * 60,
    ) {}

    /**
     * Executes the password reset request process.
     *
     * @param input - The forgot password request input containing user email
     *
     * @returns Promise<void> - Resolves when the process is complete
     *
     * @throws Will throw an error if email service fails
     *
     * @remarks
     * If the user doesn't exist, is deleted, has unverified email, or no password,
     * the method returns silently to prevent email enumeration attacks.
     */
    async execute(input: ForgotPasswordInput): Promise<void> {
        const user = await this.userRepository.findByEmail(input.email);

        if (
            !user ||
            user.isDeleted() ||
            !user.isEmailVerified ||
            !user.passwordHash
        ) {
            return;
        }

        const otp = this.cryptoService.generateOtp(8);
        const tokenHash = this.cryptoService.hashOtp(otp);
        const expiresAt = new Date(Date.now() + this.otpExpirySeconds * 1000);

        await this.verificationTokenRepository.upsert({
            userId: user.id,
            tokenHash,
            type: TokenType.PASSWORD_RESET,
            expiresAt,
        });

        await this.emailService.sendPasswordResetEmail({
            to: user.email,
            otp,
        });
    }
}
