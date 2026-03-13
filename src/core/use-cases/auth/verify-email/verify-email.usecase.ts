import { BadRequestError } from "@core/errors/bad-request.error";
import { UnauthorizedError } from "@core/errors/unauthorized.error";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/ports/repositories/verification-token.repository";
import { TokenType } from "@core/entities/verification-token.entity";
import { type OtpPort } from "@core/ports/services/otp.port";
import type { VerifyEmailInput } from "./verify-email.input";
export class VerifyEmailUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly verificationTokenRepository: IVerificationTokenRepository,
        private readonly otpService: OtpPort,
    ) {}

    async execute(input: VerifyEmailInput): Promise<void> {
        const user = await this.userRepository.findById(input.userId);

        if (!user || user.isDeleted()) {
            throw new UnauthorizedError("Unauthorized access.");
        }

        if (user.isEmailVerified) {
            return;
        }

        const verificationToken =
            await this.verificationTokenRepository.findByUserIdAndType(
                user.id,
                TokenType.EMAIL_VERIFICATION,
            );

        if (!verificationToken) {
            throw new BadRequestError("Invalid verification code.");
        }

        if (verificationToken.isExpired()) {
            throw new BadRequestError(
                "Verification code has expired. Please request a new one.",
            );
        }

        const hashedInputOtp = this.otpService.hashOtp(input.otp);
        if (hashedInputOtp !== verificationToken.tokenHash) {
            throw new BadRequestError("Invalid verification code.");
        }

        user.verifyEmail();

        await this.userRepository.update(user);

        await this.verificationTokenRepository.delete(verificationToken.id);
    }
}
