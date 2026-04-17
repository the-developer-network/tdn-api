import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * E2E tests for the Remove Post Bookmark endpoint.
 * Validates that an authenticated user can remove a post bookmark,
 * that the operation is idempotent when no bookmark exists,
 * and that proper errors are returned for invalid post IDs or unauthenticated requests.
 */
describe("DELETE /posts/:id/unsave - Remove Post Bookmark", () => {
    const ts = Date.now();
    const user = {
        email: `brp-${ts}@test.com`,
        password: "password123",
        username: `brp${ts}`,
    };

    let accessToken = "";
    let postId = "";

    /**
     * Registers a new test user, logs in to obtain an access token,
     * creates a post, and saves it as a bookmark so the first unsave test
     * has a bookmark to remove.
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
            payload: { content: "E2E test post for bookmark remove" },
        });

        postId = parseBody<{ data: { id: string } }>(postRes).data.id;

        await authRequest(accessToken, {
            method: "POST",
            url: `/posts/${postId}/save`,
        });
    });

    it("should return 200 when removing a saved bookmark", async () => {
        const response = await authRequest(accessToken, {
            method: "DELETE",
            url: `/posts/${postId}/unsave`,
        });
        const body = parseBody<{ meta: { timestamp: string } }>(response);

        expect(response.statusCode).toBe(200);
        expect(body.meta).toHaveProperty("timestamp", expect.any(String));
    });

    it("should return 200 when removing a non-existing bookmark (idempotent)", async () => {
        const response = await authRequest(accessToken, {
            method: "DELETE",
            url: `/posts/${postId}/unsave`,
        });

        expect(response.statusCode).toBe(200);
    });

    it("should return 404 when the post does not exist", async () => {
        const response = await authRequest(accessToken, {
            method: "DELETE",
            url: `/posts/${FAKE_UUID}/unsave`,
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(404);
        expect(body.title).toBe("NotFoundError");
        expect(body.detail).toBe("Post not found.");
    });

    it("should return 401 when not authenticated", async () => {
        const response = await request({
            method: "DELETE",
            url: `/posts/${postId}/unsave`,
        });
        const body = parseBody<{ title: string }>(response);

        expect(response.statusCode).toBe(401);
        expect(body.title).toBe("UnauthorizedError");
    });
});
