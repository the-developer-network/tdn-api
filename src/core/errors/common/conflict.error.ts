import { CustomError } from "./custom.error";

/**
 * Error thrown when a request conflicts with the current state of the server.
 *
 * This error is typically thrown when the request could not be completed due to
 * a conflict with the current state of the target resource, such as attempting
 * to create a resource that already exists or updating a resource with stale data.
 *
 * @extends CustomError
 */
export class ConflictError extends CustomError {
    /**
     * Creates a new ConflictError instance.
     *
     * @param message - The error message describing the conflict
     */
    constructor(message: string) {
        super(message, 409);
    }
}
