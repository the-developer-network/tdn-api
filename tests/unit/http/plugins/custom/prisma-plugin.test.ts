import { describe, it, expect, vi, beforeEach } from "vitest";
import fastify from "fastify";

// --- Mocks ---
const mockClient = {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@infrastructure/database/database.client", () => ({
    createDatabaseClient: vi.fn().mockImplementation(() => mockClient),
}));

import { createDatabaseClient } from "@infrastructure/database/database.client";
import prismaPlugin from "@plugins/custom/prisma.plugin";

const MOCK_DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";

async function buildApp() {
    const app = fastify({ logger: false });
    app.decorate("config", { DATABASE_URL: MOCK_DATABASE_URL } as any);
    await app.register(prismaPlugin);
    return app;
}

// --- Tests ---
describe("prismaPlugin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockClient.$connect = vi.fn().mockResolvedValue(undefined);
        mockClient.$disconnect = vi.fn().mockResolvedValue(undefined);
        vi.mocked(createDatabaseClient).mockImplementation(
            () => mockClient as any,
        );
    });

    describe("Initialization", () => {
        it("should call createDatabaseClient with DATABASE_URL from config", async () => {
            await buildApp();

            expect(createDatabaseClient).toHaveBeenCalledOnce();
            expect(createDatabaseClient).toHaveBeenCalledWith(
                MOCK_DATABASE_URL,
            );
        });

        it("should call $connect on the client during registration", async () => {
            await buildApp();

            expect(mockClient.$connect).toHaveBeenCalledOnce();
        });

        it("should decorate fastify instance with prisma client", async () => {
            const app = await buildApp();

            expect((app as any).prisma).toBe(mockClient);
        });
    });

    describe("onClose hook", () => {
        it("should call $disconnect when app closes", async () => {
            const app = await buildApp();
            await app.ready();
            await app.close();

            expect(mockClient.$disconnect).toHaveBeenCalledOnce();
        });

        it("should not call $disconnect before app closes", async () => {
            const app = await buildApp();
            await app.ready();

            expect(mockClient.$disconnect).not.toHaveBeenCalled();
        });

        it("should disconnect the same client that was connected", async () => {
            const app = await buildApp();
            const decoratedClient = (app as any).prisma;

            await app.ready();
            await app.close();

            expect(decoratedClient.$disconnect).toHaveBeenCalledOnce();
            expect(decoratedClient).toBe(mockClient);
        });
    });

    describe("Error handling", () => {
        it("should throw if $connect rejects", async () => {
            mockClient.$connect = vi
                .fn()
                .mockRejectedValue(new Error("Connection refused"));

            await expect(buildApp()).rejects.toThrow("Connection refused");
        });

        it("should propagate $disconnect error on close", async () => {
            mockClient.$disconnect = vi
                .fn()
                .mockRejectedValue(new Error("Disconnect failed"));

            const app = await buildApp();
            await app.ready();

            await expect(app.close()).rejects.toThrow("Disconnect failed");
        });
    });

    describe("Plugin metadata", () => {
        it("should be wrapped with fastify-plugin (skip-override)", () => {
            expect((prismaPlugin as any)[Symbol.for("skip-override")]).toBe(
                true,
            );
        });
    });
});
