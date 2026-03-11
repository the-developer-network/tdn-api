import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import cron from "node-cron";
import {
    RefreshTokenCleanupScheduler,
    type RefreshTokenCleanupSchedulerOptions,
} from "@infrastructure/jobs/refresh-token-cleanup.scheduler";
import type { RefreshTokenCleanupJob } from "@infrastructure/jobs/refresh-token-cleanup.job";
import type { FastifyBaseLogger } from "fastify";

vi.mock("node-cron");

describe("Refresh Token Cleanup Scheduler", () => {
    /**
     * Arrange (Global)
     */
    let scheduler: RefreshTokenCleanupScheduler;
    let mockJob: any;
    let mockLogger: any;
    let mockScheduledTask: any;
    let options: RefreshTokenCleanupSchedulerOptions;

    beforeEach(() => {
        mockJob = {
            run: vi.fn(),
        };

        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
        };

        options = {
            cronExpression: "0 0 * * *",
            gracePeriodHours: 24,
        };

        mockScheduledTask = {
            stop: vi.fn(),
        };

        vi.mocked(cron.schedule).mockReturnValue(mockScheduledTask as any);

        scheduler = new RefreshTokenCleanupScheduler(
            mockJob as unknown as RefreshTokenCleanupJob,
            options,
            mockLogger as unknown as FastifyBaseLogger,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Start Scheduler start()", () => {
        it("Should schedule a task with the correct cron expression.", () => {
            // Act
            scheduler.start();

            // Assert
            expect(cron.schedule).toHaveBeenCalledTimes(1);
            expect(cron.schedule).toHaveBeenCalledWith(
                options.cronExpression,
                expect.any(Function),
            );
        });

        it("Should not schedule multiple times if already started.", () => {
            // Act
            scheduler.start();
            scheduler.start();

            // Assert
            expect(cron.schedule).toHaveBeenCalledTimes(1);
        });
    });

    describe("Cron Task Execution (Inner Callback)", () => {
        it("Should successfully execute the job and log info when cron triggers.", async () => {
            // Arrange
            const expectedDeletedCount = 42;
            mockJob.run.mockResolvedValue(expectedDeletedCount);

            scheduler.start();

            const cronCallback = vi.mocked(cron.schedule).mock
                .calls[0][1] as Function;

            // Act
            cronCallback();

            await new Promise((resolve) => setTimeout(resolve, 0));

            // Assert
            expect(mockJob.run).toHaveBeenCalledTimes(1);
            expect(mockJob.run).toHaveBeenCalledWith({
                gracePeriodHours: options.gracePeriodHours,
            });

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    job: "refresh-token-cleanup",
                    deletedCount: expectedDeletedCount,
                    gracePeriodHours: options.gracePeriodHours,
                    cronExpression: options.cronExpression,
                }),
                "Refresh token cleanup completed",
            );
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it("Should catch the error and log it if the job fails during cron execution.", async () => {
            // Arrange
            const mockError = new Error("Database timeout");
            mockJob.run.mockRejectedValue(mockError);

            scheduler.start();
            const cronCallback = vi.mocked(cron.schedule).mock
                .calls[0][1] as Function;

            // Act
            cronCallback();
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    job: "refresh-token-cleanup",
                    error: mockError,
                }),
                "Refresh token cleanup failed",
            );
            expect(mockLogger.info).not.toHaveBeenCalled();
        });
    });

    describe("Stop Scheduler stop()", () => {
        it("Should stop the task and clear the reference if it is running.", async () => {
            // Arrange
            scheduler.start();

            // Act
            await scheduler.stop();

            // Assert
            expect(mockScheduledTask.stop).toHaveBeenCalledTimes(1);
        });

        it("Should do nothing if the task is not running.", async () => {
            // Act
            await scheduler.stop();

            // Assert
            expect(mockScheduledTask.stop).not.toHaveBeenCalled();
        });
    });
});
