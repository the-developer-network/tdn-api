import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * E2E tests for the Get Bookmarks endpoint.
 * Covers empty state responses for new users, mixed post/comment results
 * for seeded users, pagination behaviour, and unauthenticated access rejection.
 */
describe("GET /posts/bookmarks - Get User Bookmarks", () => {
    /**
     * Tests the response for a user who has no bookmarks yet.
     * Validates that the endpoint returns empty arrays with zero totals.
     */
    describe("empty state — user with no bookmarks", () => {
        const ts = Date.now();
        const userA = {
            email: `bgba-${ts}@test.com`,
            password: "password123",
            username: `bgba${ts}`,
        };

        let tokenA = "";

        beforeAll(async () => {
            await request({
                method: "POST",
                url: "/auth/register",
                payload: userA,
            });

            const loginRes = await request({
                method: "POST",
                url: "/auth/login",
                payload: { identifier: userA.email, password: userA.password },
            });

            tokenA = parseBody<{ data: { accessToken: string } }>(loginRes).data
                .accessToken;
        });

        it("should return 200 with empty arrays for a new user", async () => {
            const response = await authRequest(tokenA, {
                method: "GET",
                url: "/posts/bookmarks",
            });
            const body = parseBody<{
                data: { posts: unknown[]; comments: unknown[] };
                meta: {
                    postTotal: number;
                    commentTotal: number;
                    page: number;
                    timestamp: string;
                };
            }>(response);

            expect(response.statusCode).toBe(200);
            expect(body.data.posts).toEqual([]);
            expect(body.data.comments).toEqual([]);
            expect(body.meta.postTotal).toBe(0);
            expect(body.meta.commentTotal).toBe(0);
            expect(body.meta.page).toBe(1);
            expect(body.meta).toHaveProperty("timestamp", expect.any(String));
        });
    });

    /**
     * Tests responses for a user who has seeded post and comment bookmarks.
     * Validates the structure, totals, content, and pagination of the response.
     */
    describe("seeded state — user with bookmarked posts and comments", () => {
        const ts = Date.now() + 1;
        const userB = {
            email: `bgbb-${ts}@test.com`,
            password: "password123",
            username: `bgbb${ts}`,
        };

        let tokenB = "";
        let postIdA = "";
        let postIdB = "";

        /**
         * Registers user B, logs in, creates two posts and saves both as bookmarks,
         * then creates a comment on the first post and saves it as a bookmark.
         * This provides a known mixed state for all seeded-state tests.
         */
        beforeAll(async () => {
            await request({
                method: "POST",
                url: "/auth/register",
                payload: userB,
            });

            const loginRes = await request({
                method: "POST",
                url: "/auth/login",
                payload: { identifier: userB.email, password: userB.password },
            });

            tokenB = parseBody<{ data: { accessToken: string } }>(loginRes).data
                .accessToken;

            const postResA = await authRequest(tokenB, {
                method: "POST",
                url: "/posts",
                payload: { content: "Seeded bookmark post A" },
            });
            postIdA = parseBody<{ data: { id: string } }>(postResA).data.id;

            const postResB = await authRequest(tokenB, {
                method: "POST",
                url: "/posts",
                payload: { content: "Seeded bookmark post B" },
            });
            postIdB = parseBody<{ data: { id: string } }>(postResB).data.id;

            await authRequest(tokenB, {
                method: "POST",
                url: `/posts/${postIdA}/save`,
            });

            await authRequest(tokenB, {
                method: "POST",
                url: `/posts/${postIdB}/save`,
            });

            const commentRes = await authRequest(tokenB, {
                method: "POST",
                url: `/posts/${postIdA}/comments`,
                payload: { content: "Seeded bookmark comment" },
            });
            const commentId = parseBody<{ data: { id: string } }>(commentRes)
                .data.id;

            await authRequest(tokenB, {
                method: "POST",
                url: `/comments/${commentId}/save`,
            });
        });

        it("should return 200 with the saved posts in the response", async () => {
            const response = await authRequest(tokenB, {
                method: "GET",
                url: "/posts/bookmarks",
            });
            const body = parseBody<{
                data: { posts: { id: string }[] };
                meta: { postTotal: number };
            }>(response);

            expect(response.statusCode).toBe(200);
            expect(body.data.posts.length).toBeGreaterThanOrEqual(2);
            expect(body.meta.postTotal).toBeGreaterThanOrEqual(2);
        });

        it("should return 200 with the saved comment in the response", async () => {
            const response = await authRequest(tokenB, {
                method: "GET",
                url: "/posts/bookmarks",
            });
            const body = parseBody<{
                data: { comments: { id: string }[] };
                meta: { commentTotal: number };
            }>(response);

            expect(response.statusCode).toBe(200);
            expect(body.data.comments.length).toBeGreaterThanOrEqual(1);
            expect(body.meta.commentTotal).toBeGreaterThanOrEqual(1);
        });

        it("should return correct postTotal and commentTotal in meta", async () => {
            const response = await authRequest(tokenB, {
                method: "GET",
                url: "/posts/bookmarks",
            });
            const body = parseBody<{
                meta: { postTotal: number; commentTotal: number; page: number };
            }>(response);

            expect(response.statusCode).toBe(200);
            expect(body.meta.postTotal).toBe(2);
            expect(body.meta.commentTotal).toBe(1);
            expect(body.meta.page).toBe(1);
        });

        it("should support pagination with page and limit query params", async () => {
            const response = await authRequest(tokenB, {
                method: "GET",
                url: "/posts/bookmarks?page=1&limit=1",
            });
            const body = parseBody<{
                data: { posts: unknown[] };
                meta: { postTotal: number; page: number };
            }>(response);

            expect(response.statusCode).toBe(200);
            expect(body.data.posts).toHaveLength(1);
            expect(body.meta.postTotal).toBe(2);
            expect(body.meta.page).toBe(1);
        });

        it("should return 401 when not authenticated", async () => {
            const response = await request({
                method: "GET",
                url: "/posts/bookmarks",
            });
            const body = parseBody<{ title: string }>(response);

            expect(response.statusCode).toBe(401);
            expect(body.title).toBe("UnauthorizedError");
        });
    });
});
