/**
 * Input data transfer object for the RecoverAccount use case
 */
export interface RecoverAccountInput {
    /**
     * The token used to recover the account
     */
    recoveryToken: string;
    /**
     * The IP address of the device making the recovery request
     */
    deviceIp: string;
    /**
     * The user agent string of the device making the recovery request
     */
    userAgent: string;
}
