import { CustomError } from "./custom.error";

export class UnauthorizedError extends CustomError {
    constructor(message = "Missing or invalid authentication token") {
        super(message, 401);
    }
}
