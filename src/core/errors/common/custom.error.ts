/**
 * Abstract base class for custom application errors.
 *
 * This class extends the native JavaScript Error class and provides a standardized
 * way to create custom errors with HTTP status codes. All custom errors in the
 * application should extend this class to maintain consistency in error handling.
 */
export abstract class CustomError extends Error {
    /** The HTTP status code associated with this error */
    public readonly statusCode: number;

    /**
     * Creates a new CustomError instance.
     *
     * @param message - The error message describing what went wrong
     * @param statusCode - The HTTP status code for this error (defaults to 500)
     */
    constructor(message: string, statusCode: number = 500) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}
