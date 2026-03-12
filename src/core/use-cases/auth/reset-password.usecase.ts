import { BadRequestError } from "@core/errors/bad-request.error";
import type { IUserRepository } from "@core/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/repositories/verification-token.repository";
import type { PasswordService } from "@infrastructure/services/password.service";
import { TokenType } from "@core/entities/verification-token.entity";
import type { OtpPort } from "@core/ports/otp.port";

export interface ResetPasswordInput {
    email: string;
    otp: string;
    newPassword: string;
}

export class ResetPasswordUseCase {
    private readonly GENERIC_ERROR = "Invalid or expired reset credentials.";

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly verificationTokenRepository: IVerificationTokenRepository,
        private readonly passwordService: PasswordService,
        private readonly otpService: OtpPort,
    ) {}

    async execute(input: ResetPasswordInput): Promise<void> {
        const user = await this.userRepository.findByEmail(input.email);

        if (!user || user.isDeleted()) {
            throw new BadRequestError(this.GENERIC_ERROR);
        }

        const verificationToken =
            await this.verificationTokenRepository.findByUserIdAndType(
                user.id,
                TokenType.PASSWORD_RESET,
            );

        if (!verificationToken || verificationToken.isExpired()) {
            throw new BadRequestError(this.GENERIC_ERROR);
        }

        const hashedInputOtp = this.otpService.hashOtp(input.otp);

        if (hashedInputOtp !== verificationToken.tokenHash) {
            throw new BadRequestError(this.GENERIC_ERROR);
        }

        const newPasswordHash = await this.passwordService.hash(
            input.newPassword,
        );

        user.hashPassword = newPasswordHash;

        await this.userRepository.update(user);
        await this.verificationTokenRepository.delete(verificationToken.id);
    }
}
