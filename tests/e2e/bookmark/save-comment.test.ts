import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * E2E tests for the Save Comment Bookmark endpoint.
 * Validates that an authenticated user can bookmark a comment,
 * that the operation is idempotent, and that proper errors are returned
 * for invalid comment IDs or unauthenticated requests.
 */
describe("POST /comments/:commentId/save - Save Comment Bookmark", () => {
    const ts = Date.now();
    const user = {
        email: `bsc-${ts}@test.com`,
        password: "password123",
        username: `bsc${ts}`,
    };

    let accessToken = "";
    let commentId = "";

    /**
     * Registers a new test user, logs in to obtain an access token,
     * creates a post, then creates a comment on that post to use
     * as the bookmark target throughout all tests.
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
            payload: { content: "E2E test post for comment bookmark save" },
        });

        const postId = parseBody<{ data: { id: string } }>(postRes).data.id;

        const commentRes = await authRequest(accessToken, {
            method: "POST",
            url: `/posts/${postId}/comments`,
            payload: { content: "E2E test comment for bookmark save" },
        });

        commentId = parseBody<{ data: { id: string } }>(commentRes).data.id;
    });

    it("should return 201 when saving a comment bookmark", async () => {
        const response = await authRequest(accessToken, {
            method: "POST",
            url: `/comments/${commentId}/save`,
        });
        const body = parseBody<{ meta: { timestamp: string } }>(response);

        expect(response.statusCode).toBe(201);
        expect(body.meta).toHaveProperty("timestamp", expect.any(String));
    });

    it("should return 201 when saving an already-bookmarked comment (idempotent)", async () => {
        const response = await authRequest(accessToken, {
            method: "POST",
            url: `/comments/${commentId}/save`,
        });

        expect(response.statusCode).toBe(201);
    });

    it("should return 404 when the comment does not exist", async () => {
        const response = await authRequest(accessToken, {
            method: "POST",
            url: `/comments/${FAKE_UUID}/save`,
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(404);
        expect(body.title).toBe("NotFoundError");
        expect(body.detail).toBe("Comment not found.");
    });

    it("should return 401 when not authenticated", async () => {
        const response = await request({
            method: "POST",
            url: `/comments/${commentId}/save`,
        });
        const body = parseBody<{ title: string }>(response);

        expect(response.statusCode).toBe(401);
        expect(body.title).toBe("UnauthorizedError");
    });
});
