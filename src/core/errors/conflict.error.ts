import { CustomError } from "./custom.error";

export class ConflictError extends CustomError {
    constructor(message: string) {
        super(message, 409);
    }
}
