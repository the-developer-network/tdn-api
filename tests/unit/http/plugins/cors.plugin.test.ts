import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import corsPlugin from "@plugins/cors.plugin"; // Kendi yoluna göre ayarla

describe("CORS Plugin", () => {
    let app: FastifyInstance;
    const ALLOWED_ORIGIN = "https://frontend.example.com";

    beforeEach(async () => {
        app = Fastify();

        app.decorate("config", {
            CORS_ORIGIN: ALLOWED_ORIGIN,
        } as any);

        await app.register(corsPlugin);

        app.get("/test", async () => {
            return { success: true };
        });

        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    describe("CORS Headers Verification", () => {
        it("Should set Access-Control-Allow-Origin to the configured origin.", async () => {
            /** Arrange & Act */
            const response = await app.inject({
                method: "GET",
                url: "/test",
                headers: {
                    origin: ALLOWED_ORIGIN,
                },
            });

            /** Assert */
            expect(response.headers["access-control-allow-origin"]).toBe(
                ALLOWED_ORIGIN,
            );
            expect(response.headers["access-control-allow-credentials"]).toBe(
                "true",
            );
        });

        it("Should handle Pre-flight (OPTIONS) requests correctly.", async () => {
            /** Arrange & Act */
            const response = await app.inject({
                method: "OPTIONS",
                url: "/test",
                headers: {
                    origin: ALLOWED_ORIGIN,
                    "access-control-request-method": "POST",
                },
            });

            /** Assert */
            expect(response.statusCode).toBe(204);
            expect(response.headers["access-control-allow-methods"]).toBe(
                "GET, POST, PUT, PATCH, DELETE",
            );
            expect(response.headers["access-control-max-age"]).toBe("86400");
        });

        it("Should expose the correct headers to the client.", async () => {
            /** Arrange & Act */
            const response = await app.inject({
                method: "GET",
                url: "/test",
                headers: {
                    origin: ALLOWED_ORIGIN,
                },
            });

            /** Assert */
            const exposedHeaders =
                response.headers["access-control-expose-headers"];
            expect(exposedHeaders).toContain("Retry-After");
            expect(exposedHeaders).toContain("X-RateLimit-Limit");
            expect(exposedHeaders).toContain("X-RateLimit-Remaining");
            expect(exposedHeaders).toContain("X-RateLimit-Reset");
        });

        it("Should allow specified allowed headers.", async () => {
            /** Arrange & Act */
            const response = await app.inject({
                method: "OPTIONS",
                url: "/test",
                headers: {
                    origin: ALLOWED_ORIGIN,
                    "access-control-request-method": "POST",
                    "access-control-request-headers":
                        "authorization,content-type",
                },
            });

            /** Assert */
            expect(response.headers["access-control-allow-headers"]).toBe(
                "Content-Type, Authorization",
            );
        });
    });
});
