import { BadRequestError } from "@core/errors";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { PasswordPort } from "@core/ports/services/password.port";
import type { ChangePasswordUseCaseInput } from "./change-password-usecase.input";

export class ChangePasswordUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordService: PasswordPort,
    ) {}

    async execute(input: ChangePasswordUseCaseInput): Promise<void> {
        const { id, currentPassword, newPassword } = input;

        const dbHashedPassword = await this.userRepository.findPasswordById(id);

        if (!dbHashedPassword) {
            throw new BadRequestError(
                "This account is linked to a social provider. Please use the password reset flow to set a new password.",
            );
        }

        const isCurrentPasswordValid = await this.passwordService.verify(
            currentPassword,
            dbHashedPassword,
        );

        if (!isCurrentPasswordValid)
            throw new BadRequestError("Invalid current password provided.");

        if (currentPassword === newPassword) {
            throw new BadRequestError(
                "New password must be different from the current one.",
            );
        }

        const hashedNewPassword = await this.passwordService.hash(newPassword);

        await this.userRepository.updatePassword(id, hashedNewPassword);
    }
}
