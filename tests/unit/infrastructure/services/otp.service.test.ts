import { describe, beforeEach, it, expect } from "vitest";
import { OtpService } from "@infrastructure/services/otp.service";

describe("Otp Service", () => {
    /**
     * Arrange
     */
    let otpService: OtpService;

    beforeEach(() => {
        otpService = new OtpService();
    });

    describe("Generate OTP Code generateOtp()", () => {
        it("Should generate an 8-digit code by default.", () => {
            const otp = otpService.generateOtp();

            expect(otp.length).toBe(8);
        });

        it("Should contain only numeric characters.", () => {
            const otp = otpService.generateOtp();

            expect(otp).toMatch(/^[0-9]+$/);
        });

        it("Should generate a code with the specified length.", () => {
            const length = 6;

            const otp = otpService.generateOtp(length);

            expect(otp.length).toBe(length);
        });
    });

    describe("Hash OTP Code hashOtp()", () => {
        it("Should hash the provided code using the SHA-256 algorithm.", () => {
            const rawOtp = "12345678";

            const hashedOtp = otpService.hashOtp(rawOtp);

            expect(hashedOtp).toBeDefined();
            expect(hashedOtp.length).toBe(64);
            expect(hashedOtp).toMatch(/^[a-f0-9]+$/);
        });

        it("Should generate the same hash for the same OTP consistently (Deterministic).", () => {
            const rawOtp = "12345678";

            const firstHash = otpService.hashOtp(rawOtp);
            const secondHash = otpService.hashOtp(rawOtp);

            expect(firstHash).toBe(secondHash);
        });

        it("Should generate different hashes for different OTPs.", () => {
            const firstHash = otpService.hashOtp("12345678");
            const secondHash = otpService.hashOtp("87654321");

            expect(firstHash).not.toBe(secondHash);
        });
    });
});
