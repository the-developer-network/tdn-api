import { CustomError } from "./custom.error";

export class InvalidCredentialsError extends CustomError {
    constructor() {
        super("Invalid username/email or password", 401);
    }
}
