import { parseBody, request, server } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

interface SessionData {
    accessToken: string;
    refreshToken?: string;
    refreshTokenExpiresAt?: number;
    user: { id: string; username: string };
}

/**
 * E2E tests for POST /oauth/exchange endpoint.
 * Validates that a valid exchange code returns a session with tokens,
 * and that invalid or missing codes are rejected with the correct errors.
 *
 * Note: Obtaining a real exchange code requires a full GitHub/Google OAuth
 * callback flow with a real provider. The happy path instead plants a code in
 * the cache exactly as the callback would, which is enough to cover what
 * happens after the provider: the channel and the response serializer.
 */
describe("POST /oauth/exchange - OAuth Token Exchange", () => {
    const ts = Date.now();
    const user = {
        email: `oauthx-${ts}@test.com`,
        password: "password123",
        username: `oauthx${ts}`,
    };
    let userId: string;

    beforeAll(async () => {
        const registered = await request({
            method: "POST",
            url: "/auth/register",
            payload: user,
        });
        userId = parseBody<{ data: { id: string } }>(registered).data.id;
    });

    /**
     * Stores an exchange code the way a finished callback does.
     */
    const plantCode = async (delivery: "cookie" | "body"): Promise<string> => {
        const code = randomUUID();
        await server.diContainer.cradle.cacheService.set(
            `oauth:exchange:${code}`,
            JSON.stringify({
                userId,
                username: user.username,
                isEmailVerified: true,
                delivery,
            }),
            60,
        );
        return code;
    };

    it("should give a native flow its refresh token in the body and set no cookie", async () => {
        const response = await request({
            method: "POST",
            url: "/oauth/exchange",
            payload: { code: await plantCode("body") },
        });
        const data = parseBody<{ data: SessionData }>(response).data;

        // Only the e2e suite catches this: the controller has always put the
        // token in the payload, and it was the response schema that dropped it.
        expect(response.statusCode).toBe(200);
        expect(typeof data.refreshToken).toBe("string");
        expect(typeof data.refreshTokenExpiresAt).toBe("number");
        expect(data.user.id).toBe(userId);
        expect(
            response.cookies.find((c) => c.name === "refreshToken"),
        ).toBeUndefined();
    });

    it("should give a native flow a refresh token that actually refreshes", async () => {
        const exchanged = await request({
            method: "POST",
            url: "/oauth/exchange",
            payload: { code: await plantCode("body") },
        });
        const { refreshToken } = parseBody<{ data: SessionData }>(
            exchanged,
        ).data;

        const refreshed = await request({
            method: "POST",
            url: "/auth/refresh",
            payload: { refreshToken },
        });

        expect(refreshed.statusCode).toBe(200);
    });

    it("should answer a web flow with a cookie and nothing in the body", async () => {
        const response = await request({
            method: "POST",
            url: "/oauth/exchange",
            payload: { code: await plantCode("cookie") },
        });
        const data = parseBody<{ data: SessionData }>(response).data;

        expect(response.statusCode).toBe(200);
        expect(data.refreshToken).toBeUndefined();
        expect(data.refreshTokenExpiresAt).toBeUndefined();
        expect(
            response.cookies.find((c) => c.name === "refreshToken"),
        ).toBeDefined();
    });

    it("should spend a code exactly once", async () => {
        const code = await plantCode("body");

        await request({
            method: "POST",
            url: "/oauth/exchange",
            payload: { code },
        });
        const replay = await request({
            method: "POST",
            url: "/oauth/exchange",
            payload: { code },
        });

        expect(replay.statusCode).toBe(401);
    });

    it("should return 401 when the exchange code is invalid or expired", async () => {
        const response = await request({
            method: "POST",
            url: "/oauth/exchange",
            payload: { code: "invalid-or-expired-code" },
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(401);
        expect(body.title).toBe("UnauthorizedError");
        expect(body.detail).toBe("Invalid or expired exchange code");
    });

    it("should return 400 when the code field is an empty string", async () => {
        const response = await request({
            method: "POST",
            url: "/oauth/exchange",
            payload: { code: "" },
        });

        expect(response.statusCode).toBe(400);
    });

    it("should return 400 when the request body is missing entirely", async () => {
        const response = await request({
            method: "POST",
            url: "/oauth/exchange",
        });

        expect(response.statusCode).toBe(400);
    });
});
