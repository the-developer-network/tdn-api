import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * E2E tests for the Like/Unlike Comment endpoints.
 * Validates that authenticated users can like and unlike comments,
 * that both operations are idempotent, and that proper errors are returned
 * for unknown comments or unauthenticated requests.
 */
describe("Comment Like/Unlike Interactions", () => {
    const ts = Date.now();
    const user = {
        email: `ci-${ts}@test.com`,
        password: "password123",
        username: `ci${ts}`,
    };

    let accessToken = "";
    let commentId = "";

    /**
     * Registers a test user, logs in, creates a post, and creates a comment
     * to use as the interaction target throughout all tests.
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
            payload: { content: "E2E test post for comment interactions" },
        });
        const postId = parseBody<{ data: { id: string } }>(postRes).data.id;

        const commentRes = await authRequest(accessToken, {
            method: "POST",
            url: `/posts/${postId}/comments`,
            payload: { content: "Comment for like/unlike tests" },
        });
        commentId = parseBody<{ data: { id: string } }>(commentRes).data.id;
    });

    describe("POST /comments/:commentId/like - Like Comment", () => {
        it("should return 200 when liking a comment", async () => {
            const response = await authRequest(accessToken, {
                method: "POST",
                url: `/comments/${commentId}/like`,
            });
            const body = parseBody<{ meta: { timestamp: string } }>(response);

            expect(response.statusCode).toBe(200);
            expect(body.meta).toHaveProperty("timestamp", expect.any(String));
        });

        it("should return 200 when liking an already-liked comment (idempotent)", async () => {
            const response = await authRequest(accessToken, {
                method: "POST",
                url: `/comments/${commentId}/like`,
            });

            expect(response.statusCode).toBe(200);
        });

        it("should return 404 when liking a non-existent comment", async () => {
            const response = await authRequest(accessToken, {
                method: "POST",
                url: `/comments/${FAKE_UUID}/like`,
            });
            const body = parseBody<{ title: string; detail: string }>(response);

            expect(response.statusCode).toBe(404);
            expect(body.title).toBe("NotFoundError");
        });

        it("should return 401 when liking without authentication", async () => {
            const response = await request({
                method: "POST",
                url: `/comments/${commentId}/like`,
            });
            const body = parseBody<{ title: string }>(response);

            expect(response.statusCode).toBe(401);
            expect(body.title).toBe("UnauthorizedError");
        });
    });

    describe("DELETE /comments/:commentId/unlike - Unlike Comment", () => {
        it("should return 200 when unliking a comment", async () => {
            const response = await authRequest(accessToken, {
                method: "DELETE",
                url: `/comments/${commentId}/unlike`,
            });
            const body = parseBody<{ meta: { timestamp: string } }>(response);

            expect(response.statusCode).toBe(200);
            expect(body.meta).toHaveProperty("timestamp", expect.any(String));
        });

        it("should return 200 when unliking a not-liked comment (idempotent)", async () => {
            const response = await authRequest(accessToken, {
                method: "DELETE",
                url: `/comments/${commentId}/unlike`,
            });

            expect(response.statusCode).toBe(200);
        });

        it("should return 404 when unliking a non-existent comment", async () => {
            const response = await authRequest(accessToken, {
                method: "DELETE",
                url: `/comments/${FAKE_UUID}/unlike`,
            });
            const body = parseBody<{ title: string; detail: string }>(response);

            expect(response.statusCode).toBe(404);
            expect(body.title).toBe("NotFoundError");
        });

        it("should return 401 when unliking without authentication", async () => {
            const response = await request({
                method: "DELETE",
                url: `/comments/${commentId}/unlike`,
            });
            const body = parseBody<{ title: string }>(response);

            expect(response.statusCode).toBe(401);
            expect(body.title).toBe("UnauthorizedError");
        });
    });
});
