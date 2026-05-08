import { BadRequestError, NotFoundError } from "@core/errors";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { ChangeUsernameUseCaseInput } from "./change-username-usecase.input";

/**
 * Use case for changing a user's username.
 *
 * This use case handles updating a user's username in the system.
 */
export class ChangeUsernameUseCase {
    /**
     * Creates a new instance of ChangeUsernameUseCase.
     *
     * @param userRepository - Repository for managing user data
     */
    constructor(private readonly userRepository: IUserRepository) {}

    /**
     * Executes the username change process.
     *
     * @param input - Input containing user ID and new username
     * @returns Promise<void> - Resolves when username update is complete
     *
     * @remarks
     * This method updates the user's username in the database.
     * The operation is performed directly on the user repository.
     */
    async execute(input: ChangeUsernameUseCaseInput): Promise<void> {
        const user = await this.userRepository.findById(input.id);

        if (!user) throw new NotFoundError("User not found.");

        if (user.username === input.newUsername) {
            throw new BadRequestError(
                "New username must be different from the current one.",
            );
        }

        await this.userRepository.updateUsername(input.id, input.newUsername);
    }
}
