import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    RefreshToken,
    type RefreshTokenProps,
} from "@core/entities/refresh-token.entity";

describe("Refresh Token Entity", () => {
    /**
     * Arrange (Global)
     */
    let baseProps: RefreshTokenProps;

    const SYSTEM_TIME = new Date("2026-03-10T12:00:00Z");

    beforeEach(() => {
        baseProps = {
            id: "rt-123",
            tokenHash: "hashed_token_string",
            userId: "user-456",
            deviceIp: "192.168.1.1",
            userAgent: "Mozilla/5.0",
            expiresAt: new Date("2026-03-10T13:00:00Z"),
            isRevoked: false,
            createdAt: new Date("2026-03-10T10:00:00Z"),
            updatedAt: new Date("2026-03-10T10:00:00Z"),
        };

        vi.useFakeTimers();
        vi.setSystemTime(SYSTEM_TIME);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Constructor & Getters", () => {
        it("Should correctly initialize the token and return properties via getters.", () => {
            /** Act */
            const token = new RefreshToken(baseProps);

            /** Assert */
            expect(token.id).toBe(baseProps.id);
            expect(token.tokenHash).toBe(baseProps.tokenHash);
            expect(token.userId).toBe(baseProps.userId);
            expect(token.deviceIp).toBe(baseProps.deviceIp);
            expect(token.userAgent).toBe(baseProps.userAgent);
            expect(token.expiresAt).toBe(baseProps.expiresAt);
            expect(token.isRevoked).toBe(baseProps.isRevoked);
            expect(token.createdAt).toBe(baseProps.createdAt);
            expect(token.updatedAt).toBe(baseProps.updatedAt);
        });
    });

    describe("isExpired()", () => {
        it("Should return false if the current time is before the expiresAt date.", () => {
            const token = new RefreshToken({
                ...baseProps,
                expiresAt: new Date("2026-03-10T13:00:00Z"),
            });

            /** Act & Assert */
            expect(token.isExpired()).toBe(false);
        });

        it("Should return true if the current time is past the expiresAt date.", () => {
            // Arrange
            const token = new RefreshToken({
                ...baseProps,
                expiresAt: new Date("2026-03-10T11:00:00Z"),
            });

            /** Act & Assert */
            expect(token.isExpired()).toBe(true);
        });
    });

    describe("isValid()", () => {
        it("Should return true if the token is neither revoked nor expired.", () => {
            const token = new RefreshToken({
                ...baseProps,
                isRevoked: false,
                expiresAt: new Date("2026-03-10T13:00:00Z"),
            });

            expect(token.isValid()).toBe(true);
        });

        it("Should return false if the token is revoked (even if not expired).", () => {
            const token = new RefreshToken({
                ...baseProps,
                isRevoked: true,
                expiresAt: new Date("2026-03-10T13:00:00Z"),
            });

            expect(token.isValid()).toBe(false);
        });

        it("Should return false if the token is expired (even if not revoked).", () => {
            const token = new RefreshToken({
                ...baseProps,
                isRevoked: false,
                expiresAt: new Date("2026-03-10T11:00:00Z"),
            });

            expect(token.isValid()).toBe(false);
        });
    });

    describe("revoke()", () => {
        it("Should set isRevoked to true and update the updatedAt date.", () => {
            // Arrange
            const token = new RefreshToken(baseProps);

            /** Act */
            token.revoke();

            /** Assert */
            expect(token.isRevoked).toBe(true);
            expect(token.updatedAt).toEqual(SYSTEM_TIME);
        });
    });
});
