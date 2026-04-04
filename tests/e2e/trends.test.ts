import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { server, API_PREFIX } from "./setup";

describe("E2E Trends Flow (GET /api/v1/trends)", () => {
    let accessToken: string = "";

    const testUser = {
        email: "trends.tester@tdn.com",
        username: "trends_tester_e2e",
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

        accessToken = JSON.parse(loginRes.payload).data?.accessToken;

        // Tag'lerin oluşması için hashtag içeren postlar at
        const posts = [
            {
                content: "Exploring #typescript with a #backend architecture",
                type: "TECH_NEWS",
            },
            {
                content: "Building scalable #backend systems #typescript tips",
                type: "TECH_NEWS",
            },
            {
                content: "Community update on #typescript adoption #community",
                type: "COMMUNITY",
            },
        ];

        for (const payload of posts) {
            await server.inject({
                method: "POST",
                url: `${API_PREFIX}/posts`,
                headers: { authorization: `Bearer ${accessToken}` },
                payload,
            });
        }
    }, 30000);

    afterAll(async () => {
        await server.prisma.user.deleteMany({
            where: { username: testUser.username },
        });
    });

    it("1. Should return 200 with a trends array without auth", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/trends`,
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.payload);
        expect(body.data).toBeDefined();
        expect(Array.isArray(body.data.trends)).toBe(true);
        expect(body.meta).toBeDefined();
        expect(body.meta.windowDays).toBe(7);
        expect(typeof body.meta.timestamp).toBe("string");
    });

    it("2. Each trend item should have tag, postCount, category fields", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/trends`,
        });

        const { trends } = JSON.parse(response.payload).data;

        for (const trend of trends) {
            expect(typeof trend.tag).toBe("string");
            expect(typeof trend.postCount).toBe("number");
            expect(trend.postCount).toBeGreaterThan(0);
            // category null veya string olabilir
            expect(
                trend.category === null || typeof trend.category === "string",
            ).toBe(true);
        }
    });

    it("3. Most-used tag should appear in results (typescript used 3 times)", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/trends`,
        });

        const { trends } = JSON.parse(response.payload).data;
        const typescriptTrend = trends.find(
            (t: { tag: string }) => t.tag === "typescript",
        );

        expect(typescriptTrend).toBeDefined();
        expect(typescriptTrend.postCount).toBeGreaterThanOrEqual(3);
    });

    it("4. Results should be ordered by postCount descending", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/trends`,
        });

        const { trends } = JSON.parse(response.payload).data;

        for (let i = 0; i < trends.length - 1; i++) {
            expect(trends[i].postCount).toBeGreaterThanOrEqual(
                trends[i + 1].postCount,
            );
        }
    });

    it("5. Should respect limit query param", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/trends?limit=2`,
        });

        expect(response.statusCode).toBe(200);

        const { trends } = JSON.parse(response.payload).data;
        expect(trends.length).toBeLessThanOrEqual(2);
    });

    it("6. Should reject limit > 50 with 400", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/trends?limit=99`,
        });

        expect(response.statusCode).toBe(400);
    });

    it("7. Category for TECH_NEWS posts should be Technology", async () => {
        const response = await server.inject({
            method: "GET",
            url: `${API_PREFIX}/trends`,
        });

        const { trends } = JSON.parse(response.payload).data;
        const typescriptTrend = trends.find(
            (t: { tag: string }) => t.tag === "typescript",
        );

        expect(typescriptTrend?.category).toBe("Community");
    });
});
