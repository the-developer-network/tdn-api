import { CustomError } from "./custom.error";

/**
 * Error thrown when the server cannot process the request due to client errors.
 *
 * This error is typically thrown when the request contains invalid parameters,
 * malformed syntax, or other client-side issues that prevent the server from
 * understanding or processing the request.
 *
 * @extends CustomError
 */
export class BadRequestError extends CustomError {
    /**
     * Creates a new BadRequestError instance.
     *
     * @param message - The error message describing the bad request
     */
    constructor(message: string) {
        super(message, 400);
    }
}
