import { describe, it, expect, vi, beforeEach } from "vitest";
import fastify, { type FastifyInstance } from "fastify";
import { BadRequestError } from "@core/errors";
import errorHandlerPlugin from "@plugins/custom/error-handler.plugin";

// --- Helpers ---
async function buildApp() {
    const app = fastify({ logger: false });
    await app.register(errorHandlerPlugin);

    app.get("/ok", async () => ({ ok: true }));
    app.get("/throw-custom", async () => {
        throw new BadRequestError("Resource not found");
    });
    app.get("/throw-generic", async () => {
        throw new Error("Something broke");
    });
    app.get("/throw-500", async () => {
        const err = new Error("Internal crash") as any;
        err.statusCode = 500;
        throw err;
    });
    app.get("/throw-4xx", async () => {
        const err = new Error("Bad request detail") as any;
        err.statusCode = 400;
        throw err;
    });

    await app.ready();
    return app;
}

// --- Tests ---
describe("errorHandlerPlugin", () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = await buildApp();
    });

    describe("Plugin metadata", () => {
        it("should be wrapped with fastify-plugin (skip-override)", () => {
            expect(
                (errorHandlerPlugin as any)[Symbol.for("skip-override")],
            ).toBe(true);
        });
    });

    describe("Not Found Handler", () => {
        it("should return 404 for unknown routes", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/non-existent",
            });

            expect(response.statusCode).toBe(404);
        });

        it("should return RFC 7807 compliant body", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/non-existent",
            });

            const body = response.json();
            expect(body).toMatchObject({
                type: "about:blank",
                title: "Not Found",
                status: 404,
                instance: "/non-existent",
            });
        });

        it("should include method and url in detail", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/missing-route",
            });

            const body = response.json();
            expect(body.detail).toContain("GET");
            expect(body.detail).toContain("/missing-route");
        });

        it("should include correct instance field matching request url", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/some-path",
            });

            expect(response.json().instance).toBe("/some-path");
        });

        it("should return 404 for POST on unknown route", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/unknown",
            });

            expect(response.statusCode).toBe(404);
            expect(response.json().detail).toContain("POST");
        });
    });

    describe("Error Handler — CustomError", () => {
        it("should return the CustomError statusCode", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/throw-custom",
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return RFC 7807 body with CustomError details", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/throw-custom",
            });

            const body = response.json();
            expect(body).toMatchObject({
                type: "about:blank",
                status: 400,
                detail: "Resource not found",
                instance: "/throw-custom",
            });
        });

        it("should use error.name as title for CustomError", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/throw-custom",
            });

            const body = response.json();
            expect(body.title).toBeDefined();
            expect(typeof body.title).toBe("string");
        });
    });

    describe("Error Handler — Validation Error", () => {
        it("should return 400 for validation errors", async () => {
            const validationApp = fastify({ logger: false });
            await validationApp.register(errorHandlerPlugin);

            validationApp.post(
                "/validate",
                {
                    schema: {
                        body: {
                            type: "object",
                            required: ["name"],
                            properties: { name: { type: "string" } },
                        },
                    },
                },
                async () => ({ ok: true }),
            );

            await validationApp.ready();

            const response = await validationApp.inject({
                method: "POST",
                url: "/validate",
                payload: {},
            });

            expect(response.statusCode).toBe(400);
            await validationApp.close();
        });

        it("should return RFC 7807 body for validation errors", async () => {
            const validationApp = fastify({ logger: false });
            await validationApp.register(errorHandlerPlugin);

            validationApp.post(
                "/validate",
                {
                    schema: {
                        body: {
                            type: "object",
                            required: ["name"],
                            properties: { name: { type: "string" } },
                        },
                    },
                },
                async () => ({ ok: true }),
            );

            await validationApp.ready();

            const response = await validationApp.inject({
                method: "POST",
                url: "/validate",
                payload: {},
            });

            const body = response.json();
            expect(body).toMatchObject({
                type: "about:blank",
                title: "Validation Error",
                status: 400,
                detail: "Invalid data format provided.",
                instance: "/validate",
            });

            expect(body.validation).toBeDefined();
            expect(Array.isArray(body.validation)).toBe(true);
            await validationApp.close();
        });
    });

    describe("Error Handler — Generic Errors", () => {
        it("should return 500 for unhandled errors without statusCode", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/throw-generic",
            });

            expect(response.statusCode).toBe(500);
        });

        it("should return generic detail message for 500 errors", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/throw-generic",
            });

            const body = response.json();
            expect(body.detail).toBe("An unexpected error occurred.");
        });

        it("should return RFC 7807 body for 500 errors", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/throw-generic",
            });

            const body = response.json();
            expect(body).toMatchObject({
                type: "about:blank",
                status: 500,
                instance: "/throw-generic",
            });
        });

        it("should log the error for 500+ status codes", async () => {
            const logSpy = vi.spyOn(app.log, "error");

            await app.inject({ method: "GET", url: "/throw-500" });

            expect(logSpy).toHaveBeenCalledOnce();
        });

        it("should NOT log errors for 4xx status codes", async () => {
            const logSpy = vi.spyOn(app.log, "error");

            await app.inject({ method: "GET", url: "/throw-4xx" });

            expect(logSpy).not.toHaveBeenCalled();
        });

        it("should use error.message as detail for 4xx errors", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/throw-4xx",
            });

            const body = response.json();
            expect(body.detail).toBe("Bad request detail");
        });

        it("should return the actual statusCode for 4xx errors", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/throw-4xx",
            });

            expect(response.statusCode).toBe(400);
        });

        it("should use error.name as title when available", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/throw-generic",
            });

            const body = response.json();
            expect(body.title).toBe("Error");
        });

        it("should fallback to 'Internal Server Error' when error.name is missing", async () => {
            const noNameApp = fastify({ logger: false });
            await noNameApp.register(errorHandlerPlugin);

            noNameApp.get("/no-name", async () => {
                const err = Object.create(null) as any;
                err.message = "oops";
                err.statusCode = 500;
                throw err;
            });

            await noNameApp.ready();

            const response = await noNameApp.inject({
                method: "GET",
                url: "/no-name",
            });

            expect(response.json().title).toBe("Internal Server Error");
            await noNameApp.close();
        });
    });
});
