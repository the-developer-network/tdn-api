import { CustomError } from "./custom.error";

export class InvalidMediaTypeError extends CustomError {
    constructor(
        message = "Invalid file type. Only images and videos are allowed.",
    ) {
        super(message, 415);
    }
}
