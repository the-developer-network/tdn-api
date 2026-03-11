import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import helmetPlugin from "@plugins/helmet.plugin";

describe("Helmet Plugin", () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = Fastify();
        await app.register(helmetPlugin);

        app.get("/test-headers", async () => {
            return { message: "secure" };
        });

        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    describe("HTTP Security Headers", () => {
        it("Should include HSTS headers with correct max-age and subdomains.", async () => {
            /** Arrange & Act */
            const response = await app.inject({
                method: "GET",
                url: "/test-headers",
            });

            /** Assert */
            // HSTS: 31536000 seconds = 1 year
            expect(response.headers["strict-transport-security"]).toContain(
                "max-age=31536000",
            );
            expect(response.headers["strict-transport-security"]).toContain(
                "includeSubDomains",
            );
            expect(response.headers["strict-transport-security"]).toContain(
                "preload",
            );
        });

        it("Should include a customized Content-Security-Policy.", async () => {
            /** Arrange & Act */
            const response = await app.inject({
                method: "GET",
                url: "/test-headers",
            });

            /** Assert */
            const csp = response.headers["content-security-policy"] as string;
            expect(csp).toBeDefined();
            expect(csp).toContain("default-src 'self'");
            expect(csp).toContain("img-src 'self' data: validator.swagger.io");
        });

        it("Should include Cross-Origin-Resource-Policy with cross-origin.", async () => {
            /** Arrange & Act */
            const response = await app.inject({
                method: "GET",
                url: "/test-headers",
            });

            /** Assert */
            expect(response.headers["cross-origin-resource-policy"]).toBe(
                "cross-origin",
            );
        });
    });
});
