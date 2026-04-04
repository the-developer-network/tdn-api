import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { server, API_PREFIX } from "./setup";

describe("E2E Post Tag Filter (GET /posts?tag=xxx)", () => {
    let accessToken: string = "";
    let taggedPostId: string = "";
    let secondPostId: string = "";

    const testUser = {
        email: "tag.tester@tdn.com",
        username: "tag_tester_e2e",
        password: "SuperSecretPassword123!",
    };

    const TAG_NAME = "e2ejavascript";

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

    it("1. Should create a post with a hashtag", async () => {
        const response = await server.inject({
            method: "POST",
            url: `${API_PREFIX}/posts`,
            headers: { authorization: `Bearer ${accessToken}` },
            payload: {
                content: `Exploring clean architecture with #${TAG_NAME} today!`,
            },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        taggedPostId = body.data?.id;
        expect(taggedPostId).toBeDefined();
    });

    it("2. Should create a second post with the same hashtag (for popularity ordering)", async () => {
        const response = await server.inject({
            method: "POST",
            url: `${API_PREFIX}/posts`,
            headers: { authorization: `Bearer ${accessToken}` },
            payload: {
                content: `Another #${TAG_NAME} post with more engagement`,
            },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.payload);
        secondPostId = body.data?.id;
        expect(secondPostId).toBeDefined();
    });

    it("3. Should return posts filtered by tag", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/posts?tag=${TAG_NAME}`,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);

        expect(body.data).toBeDefined();
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.meta.total).toBeGreaterThanOrEqual(2);

        const ids = body.data.map((p: { id: string }) => p.id);
        expect(ids).toContain(taggedPostId);
        expect(ids).toContain(secondPostId);

        // Her post'un tags array'inde etiket adı bulunmalı
        for (const post of body.data as { tags: { name: string }[] }[]) {
            const hasTag = post.tags.some((t) => t.name === TAG_NAME);
            expect(hasTag).toBe(true);
        }
    });

    it("4. Should return posts ordered by popularity (likeCount desc) when tag is given", async () => {
        // İkinci postu beğen → likeCount artar → sıralamada önce gelmeli
        await server.inject({
            method: "POST",
            url: `${API_PREFIX}/posts/${secondPostId}/like`,
            headers: { authorization: `Bearer ${accessToken}` },
        });

        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/posts?tag=${TAG_NAME}&limit=50`,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        const ids = body.data.map((p: { id: string }) => p.id);

        const secondIndex = ids.indexOf(secondPostId);
        const firstIndex = ids.indexOf(taggedPostId);

        expect(secondIndex).toBeLessThan(firstIndex);
    });

    it("5. Should return empty list for a non-existent tag", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/posts?tag=absolutelynonexistentxyz9999`,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.data).toEqual([]);
        expect(body.meta.total).toBe(0);
    });

    it("6. Should return 400 when tag is an empty string", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/posts?tag=`,
        });

        expect(response.statusCode).toBe(400);
    });
});
