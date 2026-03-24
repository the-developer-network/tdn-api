import { CustomError } from "../common/custom.error";

/**
 * Error thrown when a user attempts to access an account that is pending deletion.
 *
 * This error indicates that the user's account has been marked for deletion and
 * cannot be accessed until the user chooses to recover it using the provided
 * recovery token.
 *
 * @extends CustomError
 */
export class AccountPendingDeletionError extends CustomError {
    /** The recovery token that can be used to restore the account */
    public readonly recoveryToken: string;

    /**
     * Creates a new AccountPendingDeletionError instance.
     *
     * @param recoveryToken - The token that can be used to recover the account
     */
    constructor(recoveryToken: string) {
        super(
            "Your account is scheduled for deletion. Do you want to recover it?",
            403,
        );
        this.recoveryToken = recoveryToken;
    }
}
