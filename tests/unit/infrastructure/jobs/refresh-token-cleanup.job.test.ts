import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import { RefreshTokenCleanupJob } from "@infrastructure/jobs/refresh-token-cleanup.job";
import type { CleanupRefreshTokensUseCase } from "@core/use-cases/auth/cleanup-refresh-tokens.usecase.ts";

describe("Refresh Token Cleanup Job", () => {
    /**
     * Arrange (Global)
     */
    let cleanupJob: RefreshTokenCleanupJob;
    let mockUseCase: any;

    beforeEach(() => {
        mockUseCase = {
            execute: vi.fn(),
        };

        cleanupJob = new RefreshTokenCleanupJob(
            mockUseCase as unknown as CleanupRefreshTokensUseCase,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("run()", () => {
        it("Should execute the Use Case with the correct grace period and return the deleted count.", async () => {
            /**
             * Arrange
             */
            const input = { gracePeriodHours: 24 };
            const expectedDeletedCount = 42;

            mockUseCase.execute.mockResolvedValue(expectedDeletedCount);

            /**
             * Act
             */
            const result = await cleanupJob.run(input);

            /**
             * Assert
             */
            expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                gracePeriodHours: input.gracePeriodHours,
            });

            expect(result).toBe(expectedDeletedCount);
        });

        it("Should propagate errors if the Use Case throws an exception.", async () => {
            /**
             * Arrange
             */
            const input = { gracePeriodHours: 24 };
            const expectedError = new Error(
                "Database connection failed during cleanup",
            );
            mockUseCase.execute.mockRejectedValue(expectedError);

            /**
             * Act & Assert
             */
            await expect(cleanupJob.run(input)).rejects.toThrow(
                "Database connection failed during cleanup",
            );
        });
    });
});
