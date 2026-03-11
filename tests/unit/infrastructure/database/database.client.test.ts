import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDatabaseClient } from "@infrastructure/database/database.client";
import { PrismaClient } from "@generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

vi.mock("@generated/prisma/client", () => ({
    PrismaClient: vi.fn(),
}));

vi.mock("@prisma/adapter-pg", () => ({
    PrismaPg: vi.fn(),
}));

describe("Database Client Factory", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createDatabaseClient()", () => {
        it("Should create a PrismaPg adapter and pass it to the PrismaClient constructor.", () => {
            /**
             * Arrange
             */
            const fakeConnectionString =
                "postgresql://testuser:testpass@localhost:5432/testdb";

            const mockAdapterInstance = { name: "fake-pg-adapter" };

            vi.mocked(PrismaPg).mockImplementation(function () {
                return mockAdapterInstance as any;
            });

            const mockPrismaClientInstance = { name: "fake-prisma-client" };

            vi.mocked(PrismaClient).mockImplementation(function () {
                return mockPrismaClientInstance as any;
            });

            /**
             * Act
             */
            const client = createDatabaseClient(fakeConnectionString);

            /**
             * Assert
             */
            expect(PrismaPg).toHaveBeenCalledTimes(1);
            expect(PrismaPg).toHaveBeenCalledWith({
                connectionString: fakeConnectionString,
            });

            expect(PrismaClient).toHaveBeenCalledTimes(1);
            expect(PrismaClient).toHaveBeenCalledWith({
                adapter: mockAdapterInstance,
            });

            expect(client).toBe(mockPrismaClientInstance);
        });
    });
});
