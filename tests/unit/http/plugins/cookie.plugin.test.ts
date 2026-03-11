import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import cookiePlugin from "@plugins/cookie.plugin"; // Adjust path as needed

describe("Cookie Plugin", () => {
    let app: FastifyInstance;
    const COOKIE_SECRET = "test-cookie-secret-key-12345";

    beforeEach(async () => {
        app = Fastify();

        // 1. Decorate with config (required by the plugin)
        app.decorate("config", {
            COOKIE_SECRET: COOKIE_SECRET,
        } as any);

        // 2. Register the cookie plugin
        await app.register(cookiePlugin);

        // 3. Add a test route to verify cookie signing
        app.get("/set-cookie", async (request, reply) => {
            return reply
                .setCookie("testCookie", "secretValue", {
                    signed: true,
                    path: "/",
                })
                .send({ success: true });
        });

        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    describe("Plugin Registration & Functionality", () => {
        it("Should successfully decorate the reply object with cookie methods.", async () => {
            /** Arrange & Act */

            /** Assert */
            expect(app.hasReplyDecorator("setCookie")).toBe(true);
            expect(app.hasReplyDecorator("cookie")).toBe(true);
            expect(app.hasRequestDecorator("cookies")).toBe(true);
        });

        it("Should correctly sign a cookie using the provided secret.", async () => {
            /** Arrange */

            /** Act */
            const response = await app.inject({
                method: "GET",
                url: "/set-cookie",
            });

            /** Assert */
            const setCookieHeader = response.headers["set-cookie"];

            expect(response.statusCode).toBe(200);
            expect(setCookieHeader).toBeDefined();

            const cookieValue = Array.isArray(setCookieHeader)
                ? setCookieHeader[0]
                : setCookieHeader;
            expect(cookieValue).toContain("testCookie=");

            expect(cookieValue).not.toContain("testCookie=secretValue;");
        });
    });
});
