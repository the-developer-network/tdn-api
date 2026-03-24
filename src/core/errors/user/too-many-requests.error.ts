import { CustomError } from "../common/custom.error";

/**
 * Error thrown when a user exceeds the allowed number of requests within a time period.
 *
 * This error is typically thrown when rate limiting is enforced and a user
 * makes too many requests in a short period of time, helping to prevent
 * abuse and maintain system performance.
 *
 * @extends CustomError
 */
export class TooManyRequestsError extends CustomError {
    /**
     * Creates a new TooManyRequestsError instance.
     *
     * @param message - Optional custom error message (defaults to "Too many requests, please try again later.")
     */
    constructor(
        message: string = "Too many requests, please try again later.",
    ) {
        super(message, 429);
    }
}
