import { CustomError } from "../common/custom.error";

/**
 * Error thrown when the number of media files exceeds the allowed limit.
 *
 * This error is typically thrown when a user attempts to upload more media files
 * than the maximum allowed for a single post, enforcing limits to maintain
 * system performance and storage constraints.
 *
 * @extends CustomError
 */
export class MediaLimitExceededError extends CustomError {
    /**
     * Creates a new MediaLimitExceededError instance.
     *
     * @param message - Optional custom error message (defaults to "Maximum 4 media files are allowed per post.")
     */
    constructor(message = "Maximum 4 media files are allowed per post.") {
        super(message, 400);
    }
}
