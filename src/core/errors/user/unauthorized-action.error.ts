import { CustomError } from "../common/custom.error";

/**
 * Error thrown when a user attempts to perform an action they are not authorized to do.
 *
 * This error is typically thrown when a user tries to access or modify resources
 * that they don't have the necessary permissions for, such as editing another
 * user's profile or deleting posts they don't own.
 *
 * @extends CustomError
 */
export class UnauthorizedActionError extends CustomError {
    /**
     * Creates a new UnauthorizedActionError instance.
     *
     * @param message - Optional custom error message (defaults to "You do not have permission to perform this action.")
     */
    constructor(
        message = "You do not have permission to perform this action.",
    ) {
        super(message, 403);
    }
}
