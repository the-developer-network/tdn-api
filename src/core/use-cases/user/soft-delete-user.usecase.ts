import { BadRequestError } from "@core/errors";
import NotFoundError from "@core/errors/not-found.error";
import type { EmailPort } from "@core/ports/email.port";
import type { PasswordPort } from "@core/ports/password.port";
import type { IUserRepository } from "@core/repositories/user.repository";

/**
 *
 */
export interface SoftDeleteUserUseCaseInput {
    id: string;
    password: string;
}

export interface SoftDeleteUserUseCaseOptions {
    day: number;
}

export default class SoftDeleteUserUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly passwordService: PasswordPort,
        private readonly emailPort: EmailPort,
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

        await this.emailPort.sendDeleteUserEmail({
            to: user.email,
        });
    }
}
