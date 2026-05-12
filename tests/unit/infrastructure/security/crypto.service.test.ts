import { describe, expect, it } from "vitest";
import { CryptoService } from "@infrastructure/security/crypto.service";

describe("CryptoService", () => {
    const svc = new CryptoService();

    describe("generateRandomHex", () => {
        it("should return a hex string with length = bytes * 2", () => {
            expect(svc.generateRandomHex(16)).toHaveLength(32);
            expect(svc.generateRandomHex(32)).toHaveLength(64);
        });

        it("should return only hex characters", () => {
            const hex = svc.generateRandomHex(20);

            expect(hex).toMatch(/^[0-9a-f]+$/);
        });

        it("should produce different values on each call", () => {
            expect(svc.generateRandomHex(16)).not.toBe(
                svc.generateRandomHex(16),
            );
        });
    });

    describe("generateOtp", () => {
        it("should return a string with the requested digit length", () => {
            const otp = svc.generateOtp(8);

            expect(otp).toHaveLength(8);
        });

        it("should be zero-padded when value is small", () => {
            // run many times to increase the chance of hitting a small value
            for (let i = 0; i < 20; i++) {
                const otp = svc.generateOtp(6);
                expect(otp).toHaveLength(6);
                expect(otp).toMatch(/^\d{6}$/);
            }
        });

        it("should default to 8 digits", () => {
            expect(svc.generateOtp()).toHaveLength(8);
        });
    });

    describe("hashOtp", () => {
        it("should return a 64-character SHA-256 hex string", () => {
            expect(svc.hashOtp("12345678")).toHaveLength(64);
        });

        it("should be deterministic for the same input", () => {
            const a = svc.hashOtp("12345678");
            const b = svc.hashOtp("12345678");

            expect(a).toBe(b);
        });

        it("should produce different hashes for different inputs", () => {
            expect(svc.hashOtp("11111111")).not.toBe(svc.hashOtp("22222222"));
        });
    });

    describe("timingSafeEqual", () => {
        it("should return true for identical strings", () => {
            expect(svc.timingSafeEqual("abc", "abc")).toBe(true);
        });

        it("should return false for different strings of the same length", () => {
            expect(svc.timingSafeEqual("abc", "xyz")).toBe(false);
        });

        it("should return false for strings of different lengths without early exit", () => {
            // fix: padding ensures no timing leak on length mismatch
            expect(svc.timingSafeEqual("short", "much-longer-string")).toBe(
                false,
            );
        });

        it("should return false for empty vs non-empty string", () => {
            expect(svc.timingSafeEqual("", "abc")).toBe(false);
        });
    });
});
