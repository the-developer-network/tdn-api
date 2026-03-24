import { CustomError } from "../common/custom.error";

/**
 * Error thrown when uploaded media has an unsupported media type.
 *
 * This error is typically thrown when a user attempts to upload media files
 * that do not match the allowed media types for a particular operation, such as
 * when only images and videos are permitted for post content.
 *
 * @extends CustomError
 */
export class InvalidMediaTypeError extends CustomError {
    /**
     * Creates a new InvalidMediaTypeError instance.
     *
     * @param message - Optional custom error message (defaults to "Invalid file type. Only images and videos are allowed.")
     */
    constructor(
        message = "Invalid file type. Only images and videos are allowed.",
    ) {
        super(message, 415);
    }
}
