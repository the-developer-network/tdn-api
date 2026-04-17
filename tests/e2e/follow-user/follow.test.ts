import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * E2E tests for the Follow User endpoint.
 * Validates that an authenticated user can follow another user,
 * that the operation is idempotent, and that proper errors are returned
 * for self-follow attempts or unauthenticated requests.
 */
describe("POST /follows - Follow User", () => {
    const ts = Date.now();
    const userA = {
        email: `fu-a-${ts}@test.com`,
        password: "password123",
        username: `fua${ts}`,
    };
    const userB = {
        email: `fu-b-${ts}@test.com`,
        password: "password123",
        username: `fub${ts}`,
    };

    let tokenA = "";
    let userAId = "";
    let userBId = "";

    /**
     * Registers two users and logs in as user A.
     * Both user IDs are extracted from register responses.
     */
    beforeAll(async () => {
        // Register user A and extract their ID
        const registerA = await request({
            method: "POST",
            url: "/auth/register",
            payload: userA,
        });
        userAId = parseBody<{ data: { id: string } }>(registerA).data.id;

        const loginA = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: userA.email, password: userA.password },
        });
        tokenA = parseBody<{ data: { accessToken: string } }>(loginA).data
            .accessToken;

        // Register user B and extract their ID
        const registerB = await request({
            method: "POST",
            url: "/auth/register",
            payload: userB,
        });
        userBId = parseBody<{ data: { id: string } }>(registerB).data.id;
    });

    it("should return 200 when following a user", async () => {
        const response = await authRequest(tokenA, {
            method: "POST",
            url: "/follows",
            payload: { targetId: userBId },
        });
        const body = parseBody<{
            data: { followersCount: number };
            meta: { timestamp: string };
        }>(response);

        expect(response.statusCode).toBe(200);
        expect(body.data.followersCount).toBeGreaterThanOrEqual(1);
        expect(body.meta).toHaveProperty("timestamp", expect.any(String));
    });

    it("should return 200 when following an already-followed user (idempotent)", async () => {
        const response = await authRequest(tokenA, {
            method: "POST",
            url: "/follows",
            payload: { targetId: userBId },
        });
        const body = parseBody<{ data: { followersCount: number } }>(response);

        expect(response.statusCode).toBe(200);
        expect(body.data.followersCount).toBeGreaterThanOrEqual(1);
    });

    it("should return 400 when following yourself", async () => {
        const response = await authRequest(tokenA, {
            method: "POST",
            url: "/follows",
            payload: { targetId: userAId },
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(400);
        expect(body.title).toBe("BadRequestError");
        expect(body.detail).toBe("You cannot follow yourself.");
    });

    it("should return 401 when not authenticated", async () => {
        const response = await request({
            method: "POST",
            url: "/follows",
            payload: { targetId: userBId },
        });
        const body = parseBody<{ title: string }>(response);

        expect(response.statusCode).toBe(401);
        expect(body.title).toBe("UnauthorizedError");
    });
});
