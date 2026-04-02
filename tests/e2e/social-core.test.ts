import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { server, API_PREFIX } from "./setup";

describe("E2E Social Core Flow (Post -> Comment -> Like)", () => {
    let accessToken: string = "";
    let postId: string = "";
    let commentId: string = "";

    const testUser = {
        email: "core.tester@tdn.com",
        username: "core_tester_123",
        password: "SuperSecretPassword123!",
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

        accessToken = body.data?.accessToken || body.accessToken;
    });

    afterAll(async () => {
        await server.prisma.user.deleteMany({
            where: { username: testUser.username },
        });
    });

    it("1. Should create a new Post", async () => {
        const response = await server.inject({
            method: "POST",
            url: `${API_PREFIX}/posts`,
            headers: { authorization: `Bearer ${accessToken}` },
            payload: {
                content: "content",
            },
        });

        expect(201).toBe(response.statusCode);
        const body = JSON.parse(response.payload);
        postId = body.data?.id || body.id;
        expect(postId).toBeDefined();
    });

    it("2. Should add a Comment to the Post", async () => {
        const response = await server.inject({
            method: "POST",
            url: `${API_PREFIX}/posts/${postId}/comments`,
            headers: { authorization: `Bearer ${accessToken}` },
            payload: {
                content: "content 🎩",
                mediaUrls: ["https://cdn.developernetwork.net/test-image.png"],
            },
        });

        expect([200, 201]).toContain(response.statusCode);
        const body = JSON.parse(response.payload);
        commentId = body.data?.id || body.id;
        expect(commentId).toBeDefined();
    });

    it("3. Should Like the Comment (Shallow Nesting)", async () => {
        const response = await server.inject({
            method: "POST",
            url: `${API_PREFIX}/comments/${commentId}/like`,
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect([200, 201]).toContain(response.statusCode);
    });

    it("4. Should Unlike the Comment", async () => {
        const response = await server.inject({
            method: "DELETE",
            url: `${API_PREFIX}/comments/${commentId}/unlike`,
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect([200, 204]).toContain(response.statusCode);
    });

    it("5. Should Delete the Comment", async () => {
        const response = await server.inject({
            method: "DELETE",
            url: `${API_PREFIX}/comments/${commentId}`,
            headers: { authorization: `Bearer ${accessToken}` },
        });

        expect([200, 204]).toContain(response.statusCode);
    });
});
