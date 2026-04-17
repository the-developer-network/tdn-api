import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * E2E tests for the Remove Comment Bookmark endpoint.
 * Validates that an authenticated user can remove a comment bookmark,
 * that the operation is idempotent when no bookmark exists,
 * and that proper errors are returned for invalid comment IDs or unauthenticated requests.
 */
describe("DELETE /comments/:commentId/unsave - Remove Comment Bookmark", () => {
    const ts = Date.now();
    const user = {
        email: `brc-${ts}@test.com`,
        password: "password123",
        username: `brc${ts}`,
    };

    let accessToken = "";
    let commentId = "";

    /**
     * Registers a new test user, logs in to obtain an access token,
     * creates a post, creates a comment on that post, then saves the comment
     * as a bookmark so the first unsave test has a bookmark to remove.
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
            payload: { content: "E2E test post for comment bookmark remove" },
        });

        const postId = parseBody<{ data: { id: string } }>(postRes).data.id;

        const commentRes = await authRequest(accessToken, {
            method: "POST",
            url: `/posts/${postId}/comments`,
            payload: { content: "E2E test comment for bookmark remove" },
        });

        commentId = parseBody<{ data: { id: string } }>(commentRes).data.id;

        await authRequest(accessToken, {
            method: "POST",
            url: `/comments/${commentId}/save`,
        });
    });

    it("should return 200 when removing a saved comment bookmark", async () => {
        const response = await authRequest(accessToken, {
            method: "DELETE",
            url: `/comments/${commentId}/unsave`,
        });
        const body = parseBody<{ meta: { timestamp: string } }>(response);

        expect(response.statusCode).toBe(200);
        expect(body.meta).toHaveProperty("timestamp", expect.any(String));
    });

    it("should return 200 when removing a non-existing comment bookmark (idempotent)", async () => {
        const response = await authRequest(accessToken, {
            method: "DELETE",
            url: `/comments/${commentId}/unsave`,
        });

        expect(response.statusCode).toBe(200);
    });

    it("should return 404 when the comment does not exist", async () => {
        const response = await authRequest(accessToken, {
            method: "DELETE",
            url: `/comments/${FAKE_UUID}/unsave`,
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(404);
        expect(body.title).toBe("NotFoundError");
        expect(body.detail).toBe("Comment not found.");
    });

    it("should return 401 when not authenticated", async () => {
        const response = await request({
            method: "DELETE",
            url: `/comments/${commentId}/unsave`,
        });
        const body = parseBody<{ title: string }>(response);

        expect(response.statusCode).toBe(401);
        expect(body.title).toBe("UnauthorizedError");
    });
});
