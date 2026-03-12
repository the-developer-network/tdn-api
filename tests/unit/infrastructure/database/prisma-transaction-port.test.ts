import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import { TransactionService } from "@infrastructure/database/transaction.service";
import { PrismaUserRepository } from "@infrastructure/repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "@infrastructure/repositories/prisma-refresh-token.repository";
import type { PrismaClient } from "@generated/prisma/client";

vi.mock("@infrastructure/repositories/prisma-user.repository");
vi.mock("@infrastructure/repositories/prisma-refresh-token.repository");

describe("Prisma Transaction Port", () => {
    /**
     * Arrange (Global)
     */
    let transactionPort: TransactionService;
    let mockPrismaClient: any;
    let mockTx: any;

    beforeEach(() => {
        mockTx = { name: "fake-transaction-client" };

        mockPrismaClient = {
            $transaction: vi.fn().mockImplementation(async (callback) => {
                return await callback(mockTx);
            }),
        };

        transactionPort = new TransactionService(
            mockPrismaClient as unknown as PrismaClient,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("runInTransaction()", () => {
        it("Should execute the work function within a transaction and inject correct repositories.", async () => {
            /**
             * Arrange
             */
            const expectedResult = "transaction_success_result";

            const mockWorkFunction = vi.fn().mockResolvedValue(expectedResult);

            /**
             * Act
             */
            const result =
                await transactionPort.runInTransaction(mockWorkFunction);

            /**
             * Assert
             */
            expect(mockPrismaClient.$transaction).toHaveBeenCalledTimes(1);

            expect(PrismaUserRepository).toHaveBeenCalledTimes(1);
            expect(PrismaUserRepository).toHaveBeenCalledWith(mockTx);

            expect(PrismaRefreshTokenRepository).toHaveBeenCalledTimes(1);
            expect(PrismaRefreshTokenRepository).toHaveBeenCalledWith(mockTx);

            expect(mockWorkFunction).toHaveBeenCalledTimes(1);
            const passedContext = mockWorkFunction.mock.calls[0][0];

            expect(passedContext).toHaveProperty("userRepository");
            expect(passedContext).toHaveProperty("refreshTokenRepository");

            expect(result).toBe(expectedResult);
        });

        it("Should rollback and throw if the work function fails.", async () => {
            /**
             * Arrange
             */
            const mockError = new Error(
                "Something went wrong inside the transaction!",
            );
            const mockWorkFunction = vi.fn().mockRejectedValue(mockError);

            /**
             * Act & Assert
             */
            await expect(
                transactionPort.runInTransaction(mockWorkFunction),
            ).rejects.toThrow("Something went wrong inside the transaction!");
        });
    });
});
