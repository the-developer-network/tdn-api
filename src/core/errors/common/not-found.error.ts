import { CustomError } from "./custom.error";

/**
 * Error thrown when a requested resource cannot be found.
 *
 * This error is typically thrown when the server cannot find the requested
 * resource, such as when attempting to access a user, post, or other entity
 * that does not exist in the system.
 *
 * @extends CustomError
 */
export class NotFoundError extends CustomError {
    /**
     * Creates a new NotFoundError instance.
     *
     * @param message - Optional custom error message (defaults to "Not Found")
     */
    constructor(message = "Not Found") {
        super(message, 404);
    }
}
