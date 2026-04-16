import { extractRefreshTokenCookie, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * End-to-end tests for POST /auth/recover-account.
 *
 * Tests the complete account-recovery lifecycle:
 *   1. Login with a soft-deleted account → 403 + recoveryToken
 *   2. Use the recoveryToken to restore the account → 200 + new session
 *   3. Use an invalid recoveryToken → 401
 *   4. After successful recovery, normal login works again → 201
 *
 * NOTE: The error handler spreads `CustomError` properties into the RFC 7807
 * response body (`...error`), so `AccountPendingDeletionError.recoveryToken`
 * is automatically included in the 403 response payload.
 */
describe("POST /auth/recover-account - Account Recovery Flow", () => {
    const ts = Date.now();

    const user = {
        email: `recover_${ts}@example.com`,
        password: "password123",
        username: `recover_${ts}`.slice(0, 30),
    };

    /**
     * Register the user before all tests. Each scenario that needs a
     * soft-deleted account will handle the deletion itself.
     */
    beforeAll(async () => {
        await request({
            method: "POST",
            url: "/auth/register",
            payload: user,
        });
    });

    /**
     * Logging in with the credentials of a soft-deleted account must
     * return 403 AccountPendingDeletionError.  The response body must
     * include a `recoveryToken` field (injected via `...error` spread in
     * the error handler).
     */
    it("should return 403 AccountPendingDeletionError with a recoveryToken when the account is pending deletion", async () => {
        const loginRes = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: user.email, password: user.password },
        });

        const accessToken = parseBody<{ data: { accessToken: string } }>(
            loginRes,
        ).data.accessToken;

        await request({
            method: "DELETE",
            url: "/users/me",
            headers: { authorization: `Bearer ${accessToken}` },
            payload: { password: user.password },
        });

        const response = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: user.email, password: user.password },
        });

        expect(response.statusCode).toBe(403);

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            instance: string;
            recoveryToken: string;
        }>(response);

        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("AccountPendingDeletionError");
        expect(typeof body.detail).toBe("string");
        expect(body.instance).toBe("/api/v1/auth/login");
        expect(typeof body.recoveryToken).toBe("string");
        expect(body.recoveryToken.length).toBeGreaterThan(0);
    });

    /**
     * Providing a valid recoveryToken must restore the account and return
     * 200 with a new access token and a refreshToken cookie — identical
     * structure to a normal login response.
     */
    it("should return 200 with a new session when a valid recoveryToken is provided", async () => {
        const ts2 = Date.now();

        const u = {
            email: `recover2_${ts2}@example.com`,
            password: "password123",
            username: `recov2_${ts2}`.slice(0, 30),
        };

        await request({ method: "POST", url: "/auth/register", payload: u });

        const loginRes = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: u.email, password: u.password },
        });

        const accessToken = parseBody<{ data: { accessToken: string } }>(
            loginRes,
        ).data.accessToken;

        await request({
            method: "DELETE",
            url: "/users/me",
            headers: { authorization: `Bearer ${accessToken}` },
            payload: { password: u.password },
        });

        const failedLogin = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: u.email, password: u.password },
        });

        const { recoveryToken } = parseBody<{ recoveryToken: string }>(
            failedLogin,
        );

        const response = await request({
            method: "POST",
            url: "/auth/recover-account",
            payload: { recoveryToken },
        });

        expect(response.statusCode).toBe(200);

        const body = parseBody<{
            data: { accessToken: string; expiresIn: number };
            meta: { timestamp: string };
        }>(response);

        expect(body.data.accessToken).toBeDefined();
        expect(typeof body.data.accessToken).toBe("string");
        expect(body.meta.timestamp).toBeDefined();

        const cookie = extractRefreshTokenCookie(response);
        expect(cookie).toBeTruthy();
    });

    /**
     * Submitting a token that does not correspond to any pending-deletion
     * account must return 401 "Invalid or expired recovery token."
     */
    it("should return 401 when the recoveryToken is invalid or expired", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/recover-account",
            payload: { recoveryToken: "invalid-or-nonexistent-token" },
        });

        expect(response.statusCode).toBe(401);

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            instance: string;
        }>(response);

        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("UnauthorizedError");
        expect(body.detail).toBe("Invalid or expired recovery token.");
        expect(body.instance).toBe("/api/v1/auth/recover-account");
    });

    /**
     * After a successful recovery, the user must be able to log in normally
     * with their original credentials, confirming that the account is fully
     * restored.
     */
    it("should allow normal login after a successful account recovery", async () => {
        const ts3 = Date.now();

        const u = {
            email: `recover3_${ts3}@example.com`,
            password: "password123",
            username: `recov3_${ts3}`.slice(0, 30),
        };

        await request({ method: "POST", url: "/auth/register", payload: u });

        const initialLogin = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: u.email, password: u.password },
        });

        const initialToken = parseBody<{ data: { accessToken: string } }>(
            initialLogin,
        ).data.accessToken;

        await request({
            method: "DELETE",
            url: "/users/me",
            headers: { authorization: `Bearer ${initialToken}` },
            payload: { password: u.password },
        });

        const failedLogin = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: u.email, password: u.password },
        });

        const { recoveryToken } = parseBody<{ recoveryToken: string }>(
            failedLogin,
        );

        await request({
            method: "POST",
            url: "/auth/recover-account",
            payload: { recoveryToken },
        });

        const response = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: u.email, password: u.password },
        });

        expect(response.statusCode).toBe(201);

        const body = parseBody<{ data: { accessToken: string } }>(response);
        expect(body.data.accessToken).toBeDefined();
    });
});
