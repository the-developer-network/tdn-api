import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * E2E tests for the Get Comment(s) endpoints.
 * Covers: list top-level comments on a post, get a single comment,
 * and get replies for a comment. Validates pagination meta and 404 errors.
 */
describe("GET Comments", () => {
    /**
     * Describe A: GET /posts/:postId/comments
     * Validates listing top-level comments with pagination.
     */
    describe("GET /posts/:postId/comments - Get Post Comments", () => {
        const ts = Date.now();
        const user = {
            email: `gc-a-${ts}@test.com`,
            password: "password123",
            username: `gca${ts}`,
        };

        let accessToken = "";
        let postId = "";
        let firstCommentId = "";

        /**
         * Registers a user, creates a post, and seeds 3 top-level comments.
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
                payload: { content: "E2E test post for get comments" },
            });
            postId = parseBody<{ data: { id: string } }>(postRes).data.id;

            // Seed 3 top-level comments
            const c1 = await authRequest(accessToken, {
                method: "POST",
                url: `/posts/${postId}/comments`,
                payload: { content: "Comment A" },
            });
            firstCommentId = parseBody<{ data: { id: string } }>(c1).data.id;

            await authRequest(accessToken, {
                method: "POST",
                url: `/posts/${postId}/comments`,
                payload: { content: "Comment B" },
            });

            await authRequest(accessToken, {
                method: "POST",
                url: `/posts/${postId}/comments`,
                payload: { content: "Comment C" },
            });
        });

        it("should return 200 with an array of comments and correct meta", async () => {
            const response = await request({
                method: "GET",
                url: `/posts/${postId}/comments`,
            });
            const body = parseBody<{
                data: { id: string; content: string }[];
                meta: { currentPage: number; limit: number };
            }>(response);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data.length).toBeGreaterThanOrEqual(3);
            expect(body.meta).toHaveProperty("currentPage", expect.any(Number));
            expect(body.meta).toHaveProperty("limit", expect.any(Number));
        });

        it("should support pagination with limit=1", async () => {
            const response = await request({
                method: "GET",
                url: `/posts/${postId}/comments?page=1&limit=1`,
            });
            const body = parseBody<{
                data: unknown[];
                meta: { currentPage: number; limit: number };
            }>(response);

            expect(response.statusCode).toBe(200);
            expect(body.data.length).toBe(1);
            expect(body.meta.currentPage).toBe(1);
            expect(body.meta.limit).toBe(1);
        });

        it("should return 404 when the post does not exist", async () => {
            const response = await request({
                method: "GET",
                url: `/posts/${FAKE_UUID}/comments`,
            });
            const body = parseBody<{ title: string }>(response);

            expect(response.statusCode).toBe(404);
            expect(body.title).toBe("NotFoundError");
        });

        /**
         * Describe B: GET /comments/:commentId
         * Re-uses the same post/comments seeded above.
         */
        describe("GET /comments/:commentId - Get Single Comment", () => {
            it("should return 200 with the comment's full data shape", async () => {
                const response = await request({
                    method: "GET",
                    url: `/comments/${firstCommentId}`,
                });
                const body = parseBody<{
                    data: {
                        id: string;
                        content: string;
                        postId: string;
                        parentId: string | null;
                        likeCount: number;
                        replyCount: number;
                        isLiked: boolean;
                        isBookmarked: boolean;
                        author: { id: string };
                    };
                    meta: { timestamp: string };
                }>(response);

                expect(response.statusCode).toBe(200);
                expect(body.data.id).toBe(firstCommentId);
                expect(body.data.content).toBe("Comment A");
                expect(body.data.postId).toBe(postId);
                expect(body.data.parentId).toBeNull();
                expect(body.data.likeCount).toEqual(expect.any(Number));
                expect(body.data.replyCount).toEqual(expect.any(Number));
                expect(body.data.isLiked).toEqual(expect.any(Boolean));
                expect(body.data.isBookmarked).toEqual(expect.any(Boolean));
                expect(body.data.author).toHaveProperty("id");
                expect(body.meta).toHaveProperty(
                    "timestamp",
                    expect.any(String),
                );
            });

            it("should return 404 when the comment does not exist", async () => {
                const response = await request({
                    method: "GET",
                    url: `/comments/${FAKE_UUID}`,
                });
                const body = parseBody<{ title: string }>(response);

                expect(response.statusCode).toBe(404);
                expect(body.title).toBe("NotFoundError");
            });
        });
    });

    /**
     * Describe C: GET /comments/:commentId/replies
     * Validates listing nested replies for a given comment.
     */
    describe("GET /comments/:commentId/replies - Get Comment Replies", () => {
        const ts = Date.now();
        const user = {
            email: `gc-c-${ts}@test.com`,
            password: "password123",
            username: `gcc${ts}`,
        };

        let accessToken = "";
        let parentCommentId = "";

        /**
         * Registers a user, creates a post, a parent comment, and 2 replies.
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
                payload: { content: "E2E test post for replies" },
            });
            const postId = parseBody<{ data: { id: string } }>(postRes).data.id;

            const parentRes = await authRequest(accessToken, {
                method: "POST",
                url: `/posts/${postId}/comments`,
                payload: { content: "Parent comment" },
            });
            parentCommentId = parseBody<{ data: { id: string } }>(parentRes)
                .data.id;

            // Seed 2 replies
            await authRequest(accessToken, {
                method: "POST",
                url: `/posts/${postId}/comments`,
                payload: { content: "Reply 1", parentId: parentCommentId },
            });

            await authRequest(accessToken, {
                method: "POST",
                url: `/posts/${postId}/comments`,
                payload: { content: "Reply 2", parentId: parentCommentId },
            });
        });

        it("should return 200 with an array of replies", async () => {
            const response = await request({
                method: "GET",
                url: `/comments/${parentCommentId}/replies`,
            });
            const body = parseBody<{
                data: { id: string; parentId: string }[];
                meta: { currentPage: number; limit: number };
            }>(response);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data.length).toBe(2);
            expect(body.data.every((r) => r.parentId === parentCommentId)).toBe(
                true,
            );
            expect(body.meta).toHaveProperty("currentPage", expect.any(Number));
            expect(body.meta).toHaveProperty("limit", expect.any(Number));
        });

        it("should support pagination with limit=1", async () => {
            const response = await request({
                method: "GET",
                url: `/comments/${parentCommentId}/replies?page=1&limit=1`,
            });
            const body = parseBody<{
                data: unknown[];
                meta: { currentPage: number; limit: number };
            }>(response);

            expect(response.statusCode).toBe(200);
            expect(body.data.length).toBe(1);
            expect(body.meta.currentPage).toBe(1);
            expect(body.meta.limit).toBe(1);
        });

        it("should return 404 when the parent comment does not exist", async () => {
            const response = await request({
                method: "GET",
                url: `/comments/${FAKE_UUID}/replies`,
            });
            const body = parseBody<{ title: string }>(response);

            expect(response.statusCode).toBe(404);
            expect(body.title).toBe("NotFoundError");
        });
    });
});
