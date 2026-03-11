import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import envPlugin from "@plugins/env.plugin";

describe("Env Plugin", () => {
    let app: FastifyInstance;

    beforeEach(() => {
        app = Fastify();
        vi.unstubAllEnvs();
    });

    afterEach(async () => {
        await app.close();
    });

    it("Should successfully load environment variables and decorate fastify with 'config'.", async () => {
        /** Arrange */
        // Mocking the required variables defined in your EnvSchema
        vi.stubEnv("PORT", "4000");
        vi.stubEnv("NODE_ENV", "test");
        vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
        vi.stubEnv("ACCESS_TOKEN_SECRET_KEY", "super-secret");
        vi.stubEnv("COOKIE_SECRET", "cookie-secret-key");

        /** Act */
        await app.register(envPlugin);
        await app.ready();

        /** Assert */
        expect(app.hasDecorator("config")).toBe(true);

        const config = (app as any).config;
        expect(config.PORT).toBe(4000);
        expect(config.NODE_ENV).toBe("test");
        expect(config.DATABASE_URL).toBe(
            "postgresql://user:pass@localhost:5432/db",
        );
        expect(config.ACCESS_TOKEN_SECRET_KEY).toBe("super-secret");
    });

    it("Should throw an error if required environment variables are missing.", async () => {
        /** Arrange */
        // Missing DATABASE_URL and others...
        vi.stubEnv("NODE_ENV", "test");

        /** Act & Assert */
        // @fastify/env throws during initialization if validation fails
        await expect(async () => {
            await app.register(envPlugin);
            await app.ready();
        }).rejects.toThrow();
    });

    it("Should use the correct dotenv path logic when in development mode.", async () => {
        /** Arrange */
        vi.stubEnv("NODE_ENV", "development");
        vi.stubEnv("PORT", "3000");
        vi.stubEnv("DATABASE_URL", "any");
        vi.stubEnv("ACCESS_TOKEN_SECRET_KEY", "any");
        vi.stubEnv("COOKIE_SECRET", "any");

        /** Act & Assert */
        await expect(app.register(envPlugin).ready()).resolves.toBeDefined();
    });
});
