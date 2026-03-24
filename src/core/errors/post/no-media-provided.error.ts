import { CustomError } from "../common/custom.error";

/**
 * Error thrown when no media files are provided for an upload operation.
 *
 * This error is typically thrown when a user attempts to create a post or
 * perform an operation that requires media files but fails to provide any
 * media content.
 *
 * @extends CustomError
 */
export class NoMediaProvidedError extends CustomError {
    /**
     * Creates a new NoMediaProvidedError instance.
     *
     * @param message - Optional custom error message (defaults to "Please provide at least one media file to upload.")
     */
    constructor(message = "Please provide at least one media file to upload.") {
        super(message, 400);
    }
}
