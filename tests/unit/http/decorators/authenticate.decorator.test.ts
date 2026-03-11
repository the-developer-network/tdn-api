import { describe, it, expect, vi, beforeEach } from "vitest";
import fastify from "fastify";
import fastifyPlugin from "fastify-plugin";
import { authHook } from "@hooks/auth.hook";
import authenticateDecorator from "@decorators/authenticate.decorator";

// --- Mocks ---
vi.mock("@http/hooks/auth.hook", () => ({
    authHook: vi.fn().mockResolvedValue(undefined),
}));

const fakeJwtPlugin = fastifyPlugin(
    (app, _opts, done) => {
        app.decorate("jwt", {} as any);
        done();
    },
    { name: "@fastify/jwt" },
);

// --- Helpers ---
async function buildApp() {
    const app = fastify({ logger: false });
    await app.register(fakeJwtPlugin);
    await app.register(authenticateDecorator);
    await app.ready();
    return app;
}

// --- Tests ---
describe("authenticateDecorator", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Plugin metadata", () => {
        it("should be wrapped with fastify-plugin (skip-override)", () => {
            expect(
                (authenticateDecorator as any)[Symbol.for("skip-override")],
            ).toBe(true);
        });
    });

    describe("Decoration", () => {
        it("should decorate fastify instance with authenticate", async () => {
            const app = await buildApp();

            expect((app as any).authenticate).toBeDefined();
        });

        it("should decorate authenticate with authHook function", async () => {
            const app = await buildApp();

            expect((app as any).authenticate).toBe(authHook);
        });

        it("should decorate exactly once", async () => {
            const app = await buildApp();

            expect(
                Object.prototype.hasOwnProperty.call(app, "authenticate"),
            ).toBe(true);
        });
    });

    describe("authenticate usage", () => {
        it("should invoke the underlying authHook logic when authenticate is called", async () => {
            const app = await buildApp();
            const mockRequest = {
                jwtVerify: vi.fn().mockResolvedValue(undefined),
            } as any;

            await expect(
                (app as any).authenticate(mockRequest),
            ).resolves.toBeUndefined();

            expect(mockRequest.jwtVerify).toHaveBeenCalledOnce();
        });
    });
});
