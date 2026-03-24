import { CustomError } from "../common/custom.error";

/**
 * Error thrown when an uploaded file has an unsupported file type.
 *
 * This error is typically thrown when a user attempts to upload a file that
 * does not match the allowed file types for a particular operation, such as
 * when only image files are permitted for post media.
 *
 * @extends CustomError
 */
export class InvalidFileTypeError extends CustomError {
    /**
     * Creates a new InvalidFileTypeError instance.
     *
     * @param message - Optional custom error message (defaults to "Invalid file type. Only images are allowed.")
     */
    constructor(message = "Invalid file type. Only images are allowed.") {
        super(message, 415);
    }
}
