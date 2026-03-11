import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import jwtPlugin from "@plugins/jwt.plugin";
import { JwtService } from "@infrastructure/services/jwt.service";

describe("JWT Plugin", () => {
    let app: FastifyInstance;

    beforeEach(() => {
        app = Fastify();
    });

    afterEach(async () => {
        await app.close();
    });

    it("Should successfully register the plugin and decorate fastify with jwtService.", async () => {
        app.decorate("config", {
            ACCESS_TOKEN_SECRET_KEY: "super-secret-test-key",
            ACCESS_TOKEN_EXPIRES_IN: 900,
            REFRESH_TOKEN_EXPIRES_IN: 86400,
        } as any);

        await app.register(jwtPlugin);
        await app.ready();

        expect(app.hasDecorator("jwtService")).toBe(true);

        const jwtService = (app as any).jwtService;
        expect(jwtService).toBeDefined();

        expect(jwtService).toBeInstanceOf(JwtService);
    });
});
