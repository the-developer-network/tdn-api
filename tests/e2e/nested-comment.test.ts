import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { server, API_PREFIX } from "./setup";

describe("E2E Nested Comment — Counter Cache & New Endpoints", () => {
    let accessToken: string = "";
    let postId: string = "";
    let topCommentId: string = "";
    let replyId: string = "";

    const testUser = {
        email: "nested.comment.tester@tdn.com",
        username: "nested_comment_tester",
        password: "SecurePass123!",
    };

    beforeAll(async () => {
        await server.prisma.user.deleteMany({
            where: { username: testUser.username },
        });

        await server.inject({
            method: "POST",
            url: `${API_PREFIX}/auth/register`,
            payload: testUser,
        });

        const loginRes = await server.inject({
            method: "POST",
            url: `${API_PREFIX}/auth/login`,
            payload: {
                identifier: testUser.email,
                password: testUser.password,
            },
        });

        const body = JSON.parse(loginRes.payload);
        accessToken = body.data?.accessToken ?? body.accessToken;

        const postRes = await server.inject({
            method: "POST",
            url: `${API_PREFIX}/posts`,
            headers: { authorization: `Bearer ${accessToken}` },
            payload: { content: "Nested comment test post" },
        });
        postId = JSON.parse(postRes.payload).data?.id;
    });

    afterAll(async () => {
        await server.prisma.user.deleteMany({
            where: { username: testUser.username },
        });
    });

    // ─── Create top-level comment ──────────────────────────────────────────────

    describe("Create top-level comment", () => {
        it("1. Should create a top-level comment (201)", async () => {
            const res = await server.inject({
                method: "POST",
                url: `${API_PREFIX}/posts/${postId}/comments`,
                headers: { authorization: `Bearer ${accessToken}` },
                payload: { content: "Top-level comment" },
            });

            expect(res.statusCode).toBe(201);
            const body = JSON.parse(res.payload);
            topCommentId = body.data?.id;
            expect(topCommentId).toBeDefined();
            expect(body.data.parentId).toBeNull();
        });
    });

    // ─── GET /comments/:commentId ──────────────────────────────────────────────

    describe("GET /comments/:commentId", () => {
        it("2. Should return 200 and the comment (no auth)", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}`,
            });

            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.data.id).toBe(topCommentId);
            expect(body.data.content).toBe("Top-level comment");
            expect(body.data.author.isMe).toBe(false);
        });

        it("3. Should populate isMe=true when the author requests the comment", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}`,
                headers: { authorization: `Bearer ${accessToken}` },
            });

            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(body.data.author.isMe).toBe(true);
        });

        it("4. Should return 401 with an invalid token", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}`,
                headers: { authorization: "Bearer invalid.token" },
            });

            expect(res.statusCode).toBe(401);
        });

        it("5. Should return 404 for a non-existent commentId", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/00000000-0000-0000-0000-000000000000`,
            });

            expect(res.statusCode).toBe(404);
        });
    });

    // ─── repliesCount counter cache ────────────────────────────────────────────

    describe("repliesCount counter cache", () => {
        it("6. repliesCount should be 0 before any reply", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}`,
            });

            const body = JSON.parse(res.payload);
            expect(body.data.replyCount).toBe(0);
        });

        it("7. Should create a reply with parentId (201)", async () => {
            const res = await server.inject({
                method: "POST",
                url: `${API_PREFIX}/posts/${postId}/comments`,
                headers: { authorization: `Bearer ${accessToken}` },
                payload: {
                    content: "A reply to the top comment",
                    parentId: topCommentId,
                },
            });

            expect(res.statusCode).toBe(201);
            const body = JSON.parse(res.payload);
            replyId = body.data?.id;
            expect(replyId).toBeDefined();
            expect(body.data.parentId).toBe(topCommentId);
        });

        it("8. repliesCount should be 1 after adding a reply", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}`,
            });

            const body = JSON.parse(res.payload);
            expect(body.data.replyCount).toBe(1);
        });
    });

    // ─── GET /comments/:commentId/replies ─────────────────────────────────────

    describe("GET /comments/:commentId/replies", () => {
        it("9. Should return 200 with the reply in the list (no auth)", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}/replies`,
            });

            expect(res.statusCode).toBe(200);
            const body = JSON.parse(res.payload);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data.length).toBe(1);
            expect(body.data[0].id).toBe(replyId);
        });

        it("10. Should return isLiked/isBookmarked=false for anonymous request", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}/replies`,
            });

            const body = JSON.parse(res.payload);
            const reply = body.data[0];
            expect(reply.isLiked).toBe(false);
            expect(reply.isBookmarked).toBe(false);
        });

        it("11. Should return meta with currentPage and limit", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}/replies?page=1&limit=5`,
            });

            const body = JSON.parse(res.payload);
            expect(body.meta.currentPage).toBe(1);
            expect(body.meta.limit).toBe(5);
        });

        it("12. Should return 401 with an invalid token", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}/replies`,
                headers: { authorization: "Bearer invalid.token" },
            });

            expect(res.statusCode).toBe(401);
        });

        it("13. Should return 404 for a non-existent parent commentId", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/00000000-0000-0000-0000-000000000000/replies`,
            });

            expect(res.statusCode).toBe(404);
        });
    });

    // ─── Delete reply → repliesCount decrement ─────────────────────────────────

    describe("repliesCount decrement on reply deletion", () => {
        it("14. Should delete the reply (204)", async () => {
            const res = await server.inject({
                method: "DELETE",
                url: `${API_PREFIX}/comments/${replyId}`,
                headers: { authorization: `Bearer ${accessToken}` },
            });

            expect(res.statusCode).toBe(204);
        });

        it("15. repliesCount should be 0 after deleting the reply", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}`,
            });

            const body = JSON.parse(res.payload);
            expect(body.data.replyCount).toBe(0);
        });

        it("16. GET /replies should return an empty array after deletion", async () => {
            const res = await server.inject({
                method: "GET",
                url: `${API_PREFIX}/comments/${topCommentId}/replies`,
            });

            const body = JSON.parse(res.payload);
            expect(Array.isArray(body.data)).toBe(true);
            expect(body.data.length).toBe(0);
        });
    });
});
