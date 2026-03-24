import { CustomError } from "../common/custom.error";

/**
 * Error thrown when attempting to create a user that already exists.
 *
 * This error is typically thrown when a user tries to register with an email
 * address or username that is already taken by another user in the system,
 * preventing duplicate accounts.
 *
 * @extends CustomError
 */
export class UserAlreadyExistsError extends CustomError {
    /**
     * Creates a new UserAlreadyExistsError instance.
     *
     * @param message - Optional custom error message (defaults to "A user with these details already exists.")
     */
    constructor(message = "A user with these details already exists.") {
        super(message, 409);
    }
}
