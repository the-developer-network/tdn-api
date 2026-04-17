import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * E2E tests for the Delete Comment endpoint.
 * Validates that the comment owner can delete their comment,
 * that non-owners receive a 403, and that proper errors are returned
 * for unknown comments or unauthenticated requests.
 */
describe("DELETE /comments/:commentId - Delete Comment", () => {
    const ts = Date.now();
    const userA = {
        email: `cd-a-${ts}@test.com`,
        password: "password123",
        username: `cda${ts}`,
    };
    const userB = {
        email: `cd-b-${ts}@test.com`,
        password: "password123",
        username: `cdb${ts}`,
    };

    let tokenA = "";
    let tokenB = "";
    let postId = "";
    let commentId = "";

    /**
     * Registers two test users, logs both in, and has user A create a post
     * and a comment to use as the deletion target throughout all tests.
     */
    beforeAll(async () => {
        // Register & login user A
        await request({
            method: "POST",
            url: "/auth/register",
            payload: userA,
        });
        const loginA = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: userA.email, password: userA.password },
        });
        tokenA = parseBody<{ data: { accessToken: string } }>(loginA).data
            .accessToken;

        // Register & login user B
        await request({
            method: "POST",
            url: "/auth/register",
            payload: userB,
        });
        const loginB = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: userB.email, password: userB.password },
        });
        tokenB = parseBody<{ data: { accessToken: string } }>(loginB).data
            .accessToken;

        // User A creates a post
        const postRes = await authRequest(tokenA, {
            method: "POST",
            url: "/posts",
            payload: { content: "E2E test post for comment deletion" },
        });
        postId = parseBody<{ data: { id: string } }>(postRes).data.id;

        // User A creates a comment
        const commentRes = await authRequest(tokenA, {
            method: "POST",
            url: `/posts/${postId}/comments`,
            payload: { content: "Comment to be deleted" },
        });
        commentId = parseBody<{ data: { id: string } }>(commentRes).data.id;
    });

    it("should return 403 when a non-owner tries to delete the comment", async () => {
        const response = await authRequest(tokenB, {
            method: "DELETE",
            url: `/comments/${commentId}`,
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(403);
        expect(body.title).toBe("ForbiddenError");
        expect(body.detail).toBe("This comment is not yours.");
    });

    it("should return 404 when the comment does not exist", async () => {
        const response = await authRequest(tokenA, {
            method: "DELETE",
            url: `/comments/${FAKE_UUID}`,
        });
        const body = parseBody<{ title: string; detail: string }>(response);

        expect(response.statusCode).toBe(404);
        expect(body.title).toBe("NotFoundError");
    });

    it("should return 401 when not authenticated", async () => {
        const response = await request({
            method: "DELETE",
            url: `/comments/${commentId}`,
        });
        const body = parseBody<{ title: string }>(response);

        expect(response.statusCode).toBe(401);
        expect(body.title).toBe("UnauthorizedError");
    });

    it("should return 204 when the comment owner deletes their comment", async () => {
        const response = await authRequest(tokenA, {
            method: "DELETE",
            url: `/comments/${commentId}`,
        });

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe("");
    });
});
