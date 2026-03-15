import { CustomError } from "./custom.error";

export default class OAuthProviderError extends CustomError {
    constructor(message = "An error occurred during authorization.") {
        super(message, 502);
    }
}
