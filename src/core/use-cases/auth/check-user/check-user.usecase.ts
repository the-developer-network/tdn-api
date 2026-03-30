import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { CheckUserUseCaseInput } from "./check-user-usecase.input";

export class CheckUserUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(input: CheckUserUseCaseInput): Promise<boolean> {
        const user = await this.userRepository.findByIdentifier(
            input.identifier,
        );

        return user !== null;
    }
}
