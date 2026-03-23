import { CustomError } from "./custom.error";

export class UnauthorizedActionError extends CustomError {
    constructor(
        message = "You do not have permission to perform this action.",
    ) {
        super(message, 403);
    }
}
