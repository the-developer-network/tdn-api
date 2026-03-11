import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mocked,
} from "vitest";
import {
    CleanupRefreshTokensUseCase,
    type CleanupRefreshTokensUseCaseInput,
} from "@core/use-cases/auth/cleanup-refresh-tokens.usecase";
import type { IRefreshTokenRepository } from "@core/repositories/refresh-token.repository";

describe("Cleanup Refresh Tokens Use Case", () => {
    let cleanupRefreshTokensUseCase: CleanupRefreshTokensUseCase;
    let mockRefreshTokenRepository: Mocked<IRefreshTokenRepository>;

    // Freezing time to a known exact point
    const SYSTEM_TIME = new Date("2026-03-10T12:00:00Z");

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(SYSTEM_TIME);

        mockRefreshTokenRepository = {
            create: vi.fn(),
            findByTokenHash: vi.fn(),
            update: vi.fn(),
            deleteInvalidBefore: vi.fn(),
            revokeAllByUserId: vi.fn(),
        } as unknown as Mocked<IRefreshTokenRepository>;

        cleanupRefreshTokensUseCase = new CleanupRefreshTokensUseCase(
            mockRefreshTokenRepository,
        );
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should correctly calculate the threshold date and return the number of deleted tokens.", async () => {
            /** Arrange */
            const gracePeriodHours = 24;
            const expectedDeletedCount = 42;

            // 24 hours in milliseconds = 24 * 60 * 60 * 1000 = 86400000 ms
            // Expected threshold date is 24 hours BEFORE the frozen system time
            const expectedThresholdDate = new Date(
                SYSTEM_TIME.getTime() - 86400000,
            );

            const input: CleanupRefreshTokensUseCaseInput = {
                gracePeriodHours,
            };

            mockRefreshTokenRepository.deleteInvalidBefore.mockResolvedValue(
                expectedDeletedCount,
            );

            /** Act */
            const result = await cleanupRefreshTokensUseCase.execute(input);

            /** Assert */
            expect(
                mockRefreshTokenRepository.deleteInvalidBefore,
            ).toHaveBeenCalledTimes(1);
            expect(
                mockRefreshTokenRepository.deleteInvalidBefore,
            ).toHaveBeenCalledWith(expectedThresholdDate);

            // Ensure the result returned by the repository is passed back to the caller
            expect(result).toBe(expectedDeletedCount);
        });

        it("Should handle a grace period of 0 hours by passing the exact current time.", async () => {
            /** Arrange */
            const gracePeriodHours = 0;
            const expectedDeletedCount = 5;

            const input: CleanupRefreshTokensUseCaseInput = {
                gracePeriodHours,
            };

            mockRefreshTokenRepository.deleteInvalidBefore.mockResolvedValue(
                expectedDeletedCount,
            );

            /** Act */
            const result = await cleanupRefreshTokensUseCase.execute(input);

            /** Assert */
            expect(
                mockRefreshTokenRepository.deleteInvalidBefore,
            ).toHaveBeenCalledTimes(1);

            // If grace period is 0, the threshold date should exactly match the system time
            expect(
                mockRefreshTokenRepository.deleteInvalidBefore,
            ).toHaveBeenCalledWith(SYSTEM_TIME);
            expect(result).toBe(expectedDeletedCount);
        });

        it("Should propagate errors if the repository operation fails.", async () => {
            /** Arrange */
            const input: CleanupRefreshTokensUseCaseInput = {
                gracePeriodHours: 12,
            };
            const mockError = new Error(
                "Database timeout while deleting tokens",
            );

            mockRefreshTokenRepository.deleteInvalidBefore.mockRejectedValue(
                mockError,
            );

            /** Act & Assert */
            await expect(
                cleanupRefreshTokensUseCase.execute(input),
            ).rejects.toThrow(mockError);
            expect(
                mockRefreshTokenRepository.deleteInvalidBefore,
            ).toHaveBeenCalledTimes(1);
        });
    });
});
