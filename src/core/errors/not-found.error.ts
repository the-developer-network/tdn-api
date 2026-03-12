import { CustomError } from "./custom.error";

export default class NotFoundError extends CustomError {
    constructor(message = "Not Found") {
        super(message, 404);
    }
}
