import { CustomError } from "./custom.error";

export class InvalidCredentialsError extends CustomError {
    constructor(message = "Invalid username/email or password") {
        super(message, 401);
    }
}
