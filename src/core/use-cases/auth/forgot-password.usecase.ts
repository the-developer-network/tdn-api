import type { IUserRepository } from "@core/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/repositories/verification-token.repository";
import type { EmailPort } from "@core/ports/email.port";
import { TokenType } from "@core/entities/verification-token.entity";
import type { OtpPort } from "@core/ports/otp.port";

export interface ForgotPasswordInput {
    email: string;
}

export class ForgotPasswordUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly verificationTokenRepository: IVerificationTokenRepository,
        private readonly emailService: EmailPort,
        private readonly otpService: OtpPort,
    ) {}

    async execute(input: ForgotPasswordInput): Promise<void> {
        const user = await this.userRepository.findByEmail(input.email);

        if (!user || user.isDeleted() || !user.isEmailVerified) {
            return;
        }

        const otp = this.otpService.generateOtp(8);
        const tokenHash = this.otpService.hashOtp(otp);
        /**
         * It can then be done from the .env file.
         */
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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
