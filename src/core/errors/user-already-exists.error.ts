import { CustomError } from "./custom.error";

export class UserAlreadyExistsError extends CustomError {
    constructor(message = "A user with these details already exists.") {
        super(message, 409);
    }
}
