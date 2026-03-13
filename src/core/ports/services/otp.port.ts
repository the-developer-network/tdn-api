export interface OtpPort {
    generateOtp(length?: number): string;
    hashOtp(otp: string): string;
}
