import { CustomError } from "./custom.error";

export class AccountPendingDeletionError extends CustomError {
    public readonly recoveryToken: string;

    constructor(recoveryToken: string) {
        super(
            "Your account is scheduled for deletion. Do you want to recover it?",
            403,
        );
        this.recoveryToken = recoveryToken;
    }
}
