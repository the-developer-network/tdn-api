import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import rateLimitPlugin from "@plugins/rate-limit.plugin"; // Kendi yoluna göre ayarla

describe("Rate Limit Plugin", () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = Fastify();

        // Register the rate limit plugin
        await app.register(rateLimitPlugin);

        // Define a dummy route to test the rate limiting behavior
        app.get("/dummy", async () => {
            return { success: true };
        });

        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    describe("Global Rate Limiter", () => {
        it("Should allow requests that are below the 100 requests per minute limit.", async () => {
            /** Arrange */
            // No specific arrangement needed.

            /** Act */
            const response = await app.inject({
                method: "GET",
                url: "/dummy",
            });

            /** Assert */
            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual({ success: true });
        });

        it("Should throw a custom TooManyRequestsError (429) when the limit is exceeded.", async () => {
            /** Arrange */
            const MAX_LIMIT = 100;

            // Exhaust the limit by making exactly MAX_LIMIT successful requests
            for (let i = 0; i < MAX_LIMIT; i++) {
                await app.inject({
                    method: "GET",
                    url: "/dummy",
                });
            }

            /** Act */
            // The 101st request should trigger the errorResponseBuilder
            const response = await app.inject({
                method: "GET",
                url: "/dummy",
            });

            /** Assert */
            // Since our custom TooManyRequestsError extends CustomError and sets statusCode to 429,
            // Fastify automatically catches it and returns a 429 response.
            expect(response.statusCode).toBe(429);

            const body = response.json();
            expect(body.statusCode).toBe(429);
            expect(body.error).toBe("Too Many Requests");
        });
    });
});
