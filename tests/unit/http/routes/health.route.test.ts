import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import healthRoutes from "@routes/health.route";

describe("Health Routes", () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = Fastify();

        await app.register(healthRoutes);
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    describe("GET /health", () => {
        it("Should return 200 OK and status 'ok'.", async () => {
            /** Arrange */

            /** Act */
            const response = await app.inject({
                method: "GET",
                url: "/health",
            });

            /** Assert */
            expect(response.statusCode).toBe(200);

            const body = response.json();
            expect(body).toEqual({ status: "ok" });
        });
    });
});
