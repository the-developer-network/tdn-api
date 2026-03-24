import { CustomError } from "../common/custom.error";

/**
 * Error thrown when an OAuth provider operation fails.
 *
 * This error is typically thrown when there are issues with OAuth authentication
 * providers such as GitHub or Google, including network errors, invalid responses,
 * or provider-specific errors during the authorization process.
 *
 * @extends CustomError
 */
export class OAuthProviderError extends CustomError {
    /**
     * Creates a new OAuthProviderError instance.
     *
     * @param message - Optional custom error message (defaults to "An error occurred during authorization.")
     */
    constructor(message = "An error occurred during authorization.") {
        super(message, 502);
    }
}
