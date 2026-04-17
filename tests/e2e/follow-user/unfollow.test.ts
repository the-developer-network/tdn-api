import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * E2E tests for the Unfollow User endpoint.
 * Validates that an authenticated user can unfollow another user,
 * that the operation is idempotent, and that proper errors are returned
 * for self-unfollow, non-existent targets, or unauthenticated requests.
 */
describe("DELETE /follows - Unfollow User", () => {
    const ts = Date.now();
    const userA = {
        email: `ufu-a-${ts}@test.com`,
        password: "password123",
        username: `ufua${ts}`,
    };
    const userB = {
        email: `ufu-b-${ts}@test.com`,
        password: "password123",
        username: `ufub${ts}`,
    };

    let tokenA = "";
    let userAId = "";
    let userBId = "";

    /**
     * Registers two users, logs in as user A, and has A follow B
     * so that the first unfollow test has a real follow to remove.
     */
    beforeAll(async () => {
        // Register user B first
        const registerB = await request({
            method: "POST",
            url: "/auth/register",
            payload: userB,
        });
        userBId = parseBody<{ data: { id: string } }>(registerB).data.id;

        // Register & login user A
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

        // Seed: A follows B
        await authRequest(tokenA, {
            method: "POST",
            url: "/follows",
            payload: { targetId: userBId },
        });
    });

    it("should return 200 when unfollowing a followed user", async () => {
        const response = await authRequest(tokenA, {
            method: "DELETE",
            url: "/follows",
            payload: { targetId: userBId },
        });
        const body = parseBody<{
            data: { followersCount: number };
            meta: { timestamp: string };
        }>(response);

        expect(response.statusCode).toBe(200);
        expect(body.data.followersCount).toEqual(expect.any(Number));
        expect(body.meta).toHaveProperty("timestamp", expect.any(String));
    });

    it("should return 200 when unfollowing a user not currently followed (idempotent)", async () => {
        const response = await authRequest(tokenA, {
            method: "DELETE",
            url: "/follows",
            payload: { targetId: userBId },
        });

        expect(response.statusCode).toBe(200);
    });

    it("should return 400 when unfollowing yourself", async () => {
        const response = await authRequest(tokenA, {
            method: "DELETE",
            url: "/follows",
            payload: { targetId: userAId },
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(400);
        expect(body.title).toBe("BadRequestError");
        expect(body.detail).toBe("You cannot unfollow yourself.");
    });

    it("should return 404 when the target user does not exist", async () => {
        const response = await authRequest(tokenA, {
            method: "DELETE",
            url: "/follows",
            payload: { targetId: FAKE_UUID },
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(404);
        expect(body.title).toBe("NotFoundError");
        expect(body.detail).toBe("User not found.");
    });

    it("should return 401 when not authenticated", async () => {
        const response = await request({
            method: "DELETE",
            url: "/follows",
            payload: { targetId: userBId },
        });
        const body = parseBody<{ title: string }>(response);

        expect(response.statusCode).toBe(401);
        expect(body.title).toBe("UnauthorizedError");
    });
});
