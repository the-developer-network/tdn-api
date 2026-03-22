import { CustomError } from "./custom.error";

export class MediaLimitExceededError extends CustomError {
    constructor(message = "Maximum 4 media files are allowed per post.") {
        super(message, 400);
    }
}
