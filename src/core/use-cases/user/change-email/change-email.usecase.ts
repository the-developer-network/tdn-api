import { BadRequestError, NotFoundError } from "@core/errors";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { ChangeEmailUseCaseInput } from "./change-email-usecase.input";

/**
 * Use case for changing a user's email address.
 *
 * This use case handles updating a user's email address in the system.
 */
export class ChangeEmailUseCase {
    /**
     * Creates a new instance of ChangeEmailUseCase.
     *
     * @param userRepository - Repository for managing user data
     */
    constructor(private readonly userRepository: IUserRepository) {}

    /**
     * Executes the email change process.
     *
     * @param input - Input containing user ID and new email address
     * @returns Promise<void> - Resolves when email update is complete
     *
     * @remarks
     * This method updates the user's email address in the database.
     * The operation is performed directly on the user repository.
     */
    async execute(input: ChangeEmailUseCaseInput): Promise<void> {
        const user = await this.userRepository.findById(input.id);

        if (!user) throw new NotFoundError("User not found.");

        if (user.email === input.newEmail) {
            throw new BadRequestError(
                "New email must be different from the current one.",
            );
        }

        await this.userRepository.updateEmail(input.id, input.newEmail);
    }
}
