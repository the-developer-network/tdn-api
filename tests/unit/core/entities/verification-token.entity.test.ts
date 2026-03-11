import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    VerificationToken,
    TokenType,
} from "@core/entities/verification-token.entity";

describe("Verification Token Entity", () => {
    const SYSTEM_TIME = new Date("2026-03-10T12:00:00Z");

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(SYSTEM_TIME);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Constructor", () => {
        it("Should correctly initialize properties.", () => {
            /** Arrange */
            const expiresAt = new Date("2026-03-10T13:00:00Z");
            const createdAt = new Date("2026-03-10T10:00:00Z");

            /** Act */
            const token = new VerificationToken(
                "token-123",
                "hashed_otp_code",
                "user-456",
                TokenType.EMAIL_VERIFICATION,
                expiresAt,
                createdAt,
            );

            /** Assert */
            expect(token.id).toBe("token-123");
            expect(token.tokenHash).toBe("hashed_otp_code");
            expect(token.userId).toBe("user-456");
            expect(token.type).toBe(TokenType.EMAIL_VERIFICATION);
            expect(token.expiresAt).toBe(expiresAt);
            expect(token.createdAt).toBe(createdAt);
        });
    });

    describe("isExpired()", () => {
        it("Should return false when expiresAt is in the future.", () => {
            /** Arrange */
            const futureDate = new Date("2026-03-10T13:00:00Z");
            const token = new VerificationToken(
                "token-1",
                "hash",
                "user-1",
                TokenType.PASSWORD_RESET,
                futureDate,
                new Date("2026-03-10T10:00:00Z"),
            );

            /** Act */
            const result = token.isExpired();

            /** Assert */
            expect(result).toBe(false);
        });

        it("Should return true when expiresAt is in the past.", () => {
            /** Arrange */
            const pastDate = new Date("2026-03-10T11:00:00Z");
            const token = new VerificationToken(
                "token-2",
                "hash",
                "user-2",
                TokenType.EMAIL_VERIFICATION,
                pastDate,
                new Date("2026-03-10T10:00:00Z"),
            );

            /** Act */
            const result = token.isExpired();

            /** Assert */
            expect(result).toBe(true);
        });

        it("Should return false when expiresAt is exactly the current time.", () => {
            /** Arrange */
            const token = new VerificationToken(
                "token-3",
                "hash",
                "user-3",
                TokenType.EMAIL_VERIFICATION,
                SYSTEM_TIME,
                new Date("2026-03-10T10:00:00Z"),
            );

            /** Act */
            const result = token.isExpired();

            /** Assert */
            expect(result).toBe(false);
        });
    });
});
