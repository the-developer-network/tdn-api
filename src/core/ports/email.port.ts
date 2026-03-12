export interface EmailInput {
    to: string;
}

export interface OtpEmailInput extends EmailInput {
    otp: string;
}

export interface EmailPort {
    sendVerificationEmail(input: OtpEmailInput): Promise<void>;
    sendPasswordResetEmail(input: OtpEmailInput): Promise<void>;
    sendDeleteUserEmail(input: EmailInput): Promise<void>;
}
