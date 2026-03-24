import { CustomError } from "../common/custom.error";

/**
 * Error thrown when a request lacks valid authentication credentials.
 *
 * This error is typically thrown when a user attempts to access a protected
 * resource without providing proper authentication or when the provided
 * authentication token is invalid, expired, or malformed.
 *
 * @extends CustomError
 */
export class UnauthorizedError extends CustomError {
    /**
     * Creates a new UnauthorizedError instance.
     *
     * @param message - Optional custom error message (defaults to "Missing or invalid authentication token")
     */
    constructor(message = "Missing or invalid authentication token") {
        super(message, 401);
    }
}
