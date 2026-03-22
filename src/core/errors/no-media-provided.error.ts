import { CustomError } from "./custom.error";

export class NoMediaProvidedError extends CustomError {
    constructor(message = "Please provide at least one media file to upload.") {
        super(message, 400);
    }
}
