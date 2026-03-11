import { CustomError } from "./custom.error";

export class TooManyRequestsError extends CustomError {
    constructor(
        message: string = "Too many requests, please try again later.",
    ) {
        super(message, 429);
    }
}
