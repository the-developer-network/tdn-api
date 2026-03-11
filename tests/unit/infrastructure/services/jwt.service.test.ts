import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import { JwtService } from "@infrastructure/services/jwt.service";
import type { FastifyInstance } from "fastify";
import type { UserPayload } from "@core/ports/auth-token.port";

describe("Jwt Service", () => {
    /**
     * Arrange (Global)
     */
    let jwtService: JwtService;
    let mockFastify: any;

    const EXPIRES_IN_SECONDS = 900;
    const REFRESH_EXPIRES_IN_SECONDS = 86400;

    beforeEach(() => {
        mockFastify = {
            jwt: {
                sign: vi.fn(),
                verify: vi.fn(),
            },
        };

        jwtService = new JwtService(
            mockFastify as unknown as FastifyInstance,
            EXPIRES_IN_SECONDS,
            REFRESH_EXPIRES_IN_SECONDS,
        );

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe("Generate Tokens generate()", () => {
        it("Should generate an access token, refresh token, and correct expiration dates.", () => {
            const payload: UserPayload = {
                id: "user-123",
                username: "testuser",
            };
            const fakeSignedToken = "fake.jwt.token";

            mockFastify.jwt.sign.mockReturnValue(fakeSignedToken);

            const expectedNowInSeconds = Math.floor(Date.now() / 1000);

            // Act
            const result = jwtService.generate(payload);

            // Assert
            expect(mockFastify.jwt.sign).toHaveBeenCalledWith(payload);
            expect(mockFastify.jwt.sign).toHaveBeenCalledTimes(1);

            expect(result.accessToken).toBe(fakeSignedToken);
            expect(result.expiresAt).toBe(
                expectedNowInSeconds + EXPIRES_IN_SECONDS,
            );

            expect(result.refreshToken).toBeDefined();
            expect(result.refreshToken.length).toBe(80);
            expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date);
            expect(result.refreshTokenExpiresAt.getTime()).toBe(
                Date.now() + REFRESH_EXPIRES_IN_SECONDS * 1000,
            );
        });
    });

    describe("Verify Token verify()", () => {
        it("Should call fastify.jwt.verify and return the decoded user payload.", () => {
            // Arrange
            const fakeToken = "fake.jwt.token";
            const expectedPayload: UserPayload = {
                id: "user-123",
                username: "testuser",
            };

            mockFastify.jwt.verify.mockReturnValue(expectedPayload);

            // Act
            const result = jwtService.verify(fakeToken);

            // Assert
            expect(mockFastify.jwt.verify).toHaveBeenCalledWith(fakeToken);
            expect(mockFastify.jwt.verify).toHaveBeenCalledTimes(1);
            expect(result).toEqual(expectedPayload);
        });
    });

    describe("Hash Refresh Secret hashRefreshSecret()", () => {
        it("Should generate a valid SHA-256 hash from the provided secret string.", () => {
            // Arrange
            const secret = "my_super_secret_refresh_token_string";

            // Act
            const hash = jwtService.hashRefreshSecret(secret);

            // Assert
            expect(hash).toBeDefined();
            expect(hash.length).toBe(64);
            expect(hash).toMatch(/^[a-f0-9]+$/);
        });

        it("Should produce the same hash consistently for the same input.", () => {
            const secret = "same_secret";

            const hash1 = jwtService.hashRefreshSecret(secret);
            const hash2 = jwtService.hashRefreshSecret(secret);

            expect(hash1).toBe(hash2);
        });
    });
});
