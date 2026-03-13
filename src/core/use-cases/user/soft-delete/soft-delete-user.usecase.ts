import { BadRequestError } from "@core/errors";
import NotFoundError from "@core/errors/not-found.error";
import type { EmailPort } from "@core/ports/services/email.port";
import type { PasswordPort } from "@core/ports/services/password.port";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { SoftDeleteUserUseCaseInput } from "./soft-delete-user-usecase.input";
import type { SoftDeleteUserUseCaseOptions } from "./soft-delete-user-usecase.options";

export default class SoftDeleteUserUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly passwordService: PasswordPort,
        private readonly emailService: EmailPort,
        private readonly options: SoftDeleteUserUseCaseOptions,
    ) {}
    /**
     *
     * @param id User Id
     */
    async execute(input: SoftDeleteUserUseCaseInput): Promise<void> {
        const user = await this.userRepo.findById(input.id);

        if (!user || !user.passwordHash)
            throw new NotFoundError("The user cannot be deleted.");

        const isPasswordValid = await this.passwordService.verify(
            input.password,
            user.passwordHash,
        );

        if (!isPasswordValid) throw new BadRequestError("Invalid password.");

        const deletedAt = new Date();
        deletedAt.setDate(deletedAt.getDate() + this.options.day);

        await this.userRepo.softDeleteById(input.id, deletedAt);

        await this.emailService.sendDeleteUserEmail({
            to: user.email,
        });
    }
}
