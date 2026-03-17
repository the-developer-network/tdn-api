import { CustomError } from "./custom.error";

export class InvalidFileTypeError extends CustomError {
    constructor(message = "Invalid file type. Only images are allowed.") {
        super(message, 415);
    }
}
