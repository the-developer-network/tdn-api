import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { ChangeEmailUseCaseInput } from "./change-email-usecase.input";

export class ChangeEmailUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(input: ChangeEmailUseCaseInput): Promise<void> {
        await this.userRepository.updateEmail(input.id, input.newEmail);
    }
}
