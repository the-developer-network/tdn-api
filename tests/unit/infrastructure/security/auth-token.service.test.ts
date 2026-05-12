import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthTokenService } from "@infrastructure/security/auth-token.service";

const mockJwt = {
    sign: vi.fn(),
    verify: vi.fn(),
};

const ACCESS_TTL = 900;
const REFRESH_TTL = 604800;

describe("AuthTokenService", () => {
    let svc: AuthTokenService;

    beforeEach(() => {
        vi.clearAllMocks();
        svc = new AuthTokenService(mockJwt as any, ACCESS_TTL, REFRESH_TTL);
    });

    describe("generate", () => {
        it("should call jwt.sign with the user payload", () => {
            mockJwt.sign.mockReturnValue("signed.access.token");

            svc.generate({ id: "user-1", username: "alice" });

            expect(mockJwt.sign).toHaveBeenCalledWith({
                id: "user-1",
                username: "alice",
            });
        });

        it("should return the signed access token from jwt.sign", () => {
            mockJwt.sign.mockReturnValue("signed.access.token");

            const result = svc.generate({ id: "user-1", username: "alice" });

            expect(result.accessToken).toBe("signed.access.token");
        });

        it("should return a 80-character hex refresh token (40 random bytes)", () => {
            mockJwt.sign.mockReturnValue("signed.access.token");

            const result = svc.generate({ id: "user-1", username: "alice" });

            expect(result.refreshToken).toHaveLength(80);
            expect(result.refreshToken).toMatch(/^[0-9a-f]+$/);
        });

        it("should return different refresh tokens on each call", () => {
            mockJwt.sign.mockReturnValue("signed.access.token");

            const r1 = svc.generate({ id: "user-1", username: "alice" });
            const r2 = svc.generate({ id: "user-1", username: "alice" });

            expect(r1.refreshToken).not.toBe(r2.refreshToken);
        });

        it("should set expiresAt approximately now + ACCESS_TTL seconds", () => {
            mockJwt.sign.mockReturnValue("signed.access.token");
            const before = Math.floor(Date.now() / 1000);

            const result = svc.generate({ id: "user-1", username: "alice" });

            const after = Math.floor(Date.now() / 1000);
            expect(result.expiresAt).toBeGreaterThanOrEqual(
                before + ACCESS_TTL,
            );
            expect(result.expiresAt).toBeLessThanOrEqual(after + ACCESS_TTL);
        });

        it("should set refreshTokenExpiresAt approximately now + REFRESH_TTL seconds", () => {
            mockJwt.sign.mockReturnValue("signed.access.token");
            const before = Math.floor(Date.now() / 1000);

            const result = svc.generate({ id: "user-1", username: "alice" });

            const after = Math.floor(Date.now() / 1000);
            expect(result.refreshTokenExpiresAt).toBeGreaterThanOrEqual(
                before + REFRESH_TTL,
            );
            expect(result.refreshTokenExpiresAt).toBeLessThanOrEqual(
                after + REFRESH_TTL,
            );
        });
    });

    describe("verify", () => {
        it("should delegate to jwt.verify and return the payload", () => {
            const payload = { id: "user-1", username: "alice" };
            mockJwt.verify.mockReturnValue(payload);

            const result = svc.verify("some.jwt.token");

            expect(mockJwt.verify).toHaveBeenCalledWith("some.jwt.token");
            expect(result).toEqual(payload);
        });
    });

    describe("hashRefreshSecret", () => {
        it("should return a 64-character SHA-256 hex string", () => {
            expect(svc.hashRefreshSecret("mysecret")).toHaveLength(64);
        });

        it("should be deterministic for the same input", () => {
            expect(svc.hashRefreshSecret("mysecret")).toBe(
                svc.hashRefreshSecret("mysecret"),
            );
        });

        it("should produce different hashes for different inputs", () => {
            expect(svc.hashRefreshSecret("secret-a")).not.toBe(
                svc.hashRefreshSecret("secret-b"),
            );
        });
    });

    describe("generateRecoveryToken", () => {
        it("should call jwt.sign with sub and account_recovery purpose", () => {
            mockJwt.sign.mockReturnValue("recovery.token");

            svc.generateRecoveryToken("user-42");

            expect(mockJwt.sign).toHaveBeenCalledWith({
                sub: "user-42",
                purpose: "account_recovery",
            });
        });

        it("should return the signed token from jwt.sign", () => {
            mockJwt.sign.mockReturnValue("recovery.token");

            expect(svc.generateRecoveryToken("user-42")).toBe("recovery.token");
        });
    });

    describe("verifyRecoveryToken", () => {
        it("should delegate to jwt.verify and return the recovery payload", () => {
            const payload = { sub: "user-42", purpose: "account_recovery" };
            mockJwt.verify.mockReturnValue(payload);

            const result = svc.verifyRecoveryToken("recovery.token");

            expect(mockJwt.verify).toHaveBeenCalledWith("recovery.token");
            expect(result).toEqual(payload);
        });
    });
});
