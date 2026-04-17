import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * E2E tests for the Save Post Bookmark endpoint.
 * Validates that an authenticated user can bookmark a post,
 * that the operation is idempotent, and that proper errors are returned
 * for invalid post IDs or unauthenticated requests.
 */
describe("POST /posts/:id/save - Save Post Bookmark", () => {
    const ts = Date.now();
    const user = {
        email: `bsp-${ts}@test.com`,
        password: "password123",
        username: `bsp${ts}`,
    };

    let accessToken = "";
    let postId = "";

    /**
     * Registers a new test user, logs in to obtain an access token,
     * and creates a post to use as the bookmark target throughout all tests.
     */
    beforeAll(async () => {
        await request({
            method: "POST",
            url: "/auth/register",
            payload: user,
        });

        const loginRes = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: user.email, password: user.password },
        });

        accessToken = parseBody<{ data: { accessToken: string } }>(loginRes)
            .data.accessToken;

        const postRes = await authRequest(accessToken, {
            method: "POST",
            url: "/posts",
            payload: { content: "E2E test post for bookmark save" },
        });

        postId = parseBody<{ data: { id: string } }>(postRes).data.id;
    });

    it("should return 201 when saving a post bookmark", async () => {
        const response = await authRequest(accessToken, {
            method: "POST",
            url: `/posts/${postId}/save`,
        });
        const body = parseBody<{ meta: { timestamp: string } }>(response);

        expect(response.statusCode).toBe(201);
        expect(body.meta).toHaveProperty("timestamp", expect.any(String));
    });

    it("should return 201 when saving an already-bookmarked post (idempotent)", async () => {
        const response = await authRequest(accessToken, {
            method: "POST",
            url: `/posts/${postId}/save`,
        });

        expect(response.statusCode).toBe(201);
    });

    it("should return 404 when the post does not exist", async () => {
        const response = await authRequest(accessToken, {
            method: "POST",
            url: `/posts/${FAKE_UUID}/save`,
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(404);
        expect(body.title).toBe("NotFoundError");
        expect(body.detail).toBe("Post not found.");
    });

    it("should return 401 when not authenticated", async () => {
        const response = await request({
            method: "POST",
            url: `/posts/${postId}/save`,
        });
        const body = parseBody<{ title: string }>(response);

        expect(response.statusCode).toBe(401);
        expect(body.title).toBe("UnauthorizedError");
    });
});
