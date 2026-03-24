import { CustomError } from "../common/custom.error";

/**
 * Error thrown when authentication fails due to invalid credentials.
 *
 * This error is typically thrown when a user provides incorrect username/email
 * or password during the authentication process.
 *
 * @extends CustomError
 */
export class InvalidCredentialsError extends CustomError {
    /**
     * Creates a new InvalidCredentialsError instance.
     *
     * @param message - Optional custom error message (defaults to "Invalid username/email or password")
     */
    constructor(message = "Invalid username/email or password") {
        super(message, 401);
    }
}
