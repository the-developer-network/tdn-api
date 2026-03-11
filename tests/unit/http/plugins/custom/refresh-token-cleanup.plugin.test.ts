import { describe, it, expect, vi, beforeEach } from "vitest";
import fastify from "fastify";

const mockSchedulerInstance = {
    start: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@infrastructure/repositories/prisma-refresh-token.repository", () => ({
    PrismaRefreshTokenRepository: vi.fn().mockImplementation(function () {
        return {};
    }),
}));

vi.mock("@core/use-cases/auth/cleanup-refresh-tokens.usecase", () => ({
    CleanupRefreshTokensUseCase: vi.fn().mockImplementation(function () {
        return {};
    }),
}));

vi.mock("@infrastructure/jobs/refresh-token-cleanup.job", () => ({
    RefreshTokenCleanupJob: vi.fn().mockImplementation(function () {
        return {};
    }),
}));

vi.mock("@infrastructure/jobs/refresh-token-cleanup.scheduler", () => ({
    RefreshTokenCleanupScheduler: vi.fn().mockImplementation(function () {
        return mockSchedulerInstance;
    }),
}));

import { CleanupRefreshTokensUseCase } from "@core/use-cases/auth/cleanup-refresh-tokens.usecase";
import { RefreshTokenCleanupJob } from "@infrastructure/jobs/refresh-token-cleanup.job";
import { RefreshTokenCleanupScheduler } from "@infrastructure/jobs/refresh-token-cleanup.scheduler";
import { PrismaRefreshTokenRepository } from "@infrastructure/repositories/prisma-refresh-token.repository";
import refreshTokenCleanupPlugin from "@plugins/custom/refresh-token-cleanup.plugin";

const MOCK_CONFIG = {
    REFRESH_TOKEN_CLEANUP_CRON: "0 * * * *",
    REFRESH_TOKEN_CLEANUP_GRACE_PERIOD_HOURS: 24,
};

const MOCK_PRISMA = { $connect: vi.fn() };

// --- Helper ---
async function buildApp() {
    const app = fastify({ logger: false });
    app.decorate("prisma", MOCK_PRISMA as any);
    app.decorate("config", MOCK_CONFIG as any);
    await app.register(refreshTokenCleanupPlugin);
    return app;
}

// --- Tests ---
describe("refreshTokenCleanupPlugin", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset scheduler mock after clearAllMocks
        mockSchedulerInstance.start = vi.fn();
        mockSchedulerInstance.stop = vi.fn().mockResolvedValue(undefined);

        vi.mocked(RefreshTokenCleanupScheduler).mockImplementation(function () {
            return mockSchedulerInstance;
        } as any);
    });

    describe("Dependency wiring", () => {
        it("should instantiate PrismaRefreshTokenRepository with fastify.prisma", async () => {
            await buildApp();

            expect(PrismaRefreshTokenRepository).toHaveBeenCalledOnce();
            expect(PrismaRefreshTokenRepository).toHaveBeenCalledWith(
                MOCK_PRISMA,
            );
        });

        it("should instantiate CleanupRefreshTokensUseCase with the repository instance", async () => {
            await buildApp();

            const repoInstance = vi.mocked(PrismaRefreshTokenRepository).mock
                .results[0].value;
            expect(CleanupRefreshTokensUseCase).toHaveBeenCalledOnce();
            expect(CleanupRefreshTokensUseCase).toHaveBeenCalledWith(
                repoInstance,
            );
        });

        it("should instantiate RefreshTokenCleanupJob with the use case instance", async () => {
            await buildApp();

            const useCaseInstance = vi.mocked(CleanupRefreshTokensUseCase).mock
                .results[0].value;
            expect(RefreshTokenCleanupJob).toHaveBeenCalledOnce();
            expect(RefreshTokenCleanupJob).toHaveBeenCalledWith(
                useCaseInstance,
            );
        });

        it("should instantiate RefreshTokenCleanupScheduler with job, config and logger", async () => {
            const app = await buildApp();

            const jobInstance = vi.mocked(RefreshTokenCleanupJob).mock
                .results[0].value;
            expect(RefreshTokenCleanupScheduler).toHaveBeenCalledOnce();
            expect(RefreshTokenCleanupScheduler).toHaveBeenCalledWith(
                jobInstance,
                {
                    cronExpression: MOCK_CONFIG.REFRESH_TOKEN_CLEANUP_CRON,
                    gracePeriodHours:
                        MOCK_CONFIG.REFRESH_TOKEN_CLEANUP_GRACE_PERIOD_HOURS,
                },
                app.log,
            );
        });
    });

    describe("onReady hook", () => {
        it("should start the scheduler when the app is ready", async () => {
            const app = await buildApp();
            await app.ready();

            expect(mockSchedulerInstance.start).toHaveBeenCalledOnce();
        });

        it("should not start the scheduler before app.ready()", async () => {
            await buildApp();
            // ready() not called yet
            expect(mockSchedulerInstance.start).not.toHaveBeenCalled();
        });

        it("should log info with correct metadata on ready", async () => {
            const app = await buildApp();
            const logSpy = vi.spyOn(app.log, "info");

            await app.ready();

            expect(logSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    context: "SystemScheduler",
                    jobName: "RefreshTokenCleanup",
                    status: "Started",
                    config: {
                        cronExpression: MOCK_CONFIG.REFRESH_TOKEN_CLEANUP_CRON,
                        gracePeriodHours:
                            MOCK_CONFIG.REFRESH_TOKEN_CLEANUP_GRACE_PERIOD_HOURS,
                    },
                }),
                expect.any(String),
            );
        });
    });

    describe("onClose hook", () => {
        it("should stop the scheduler when the app closes", async () => {
            const app = await buildApp();
            await app.ready();
            await app.close();

            expect(mockSchedulerInstance.stop).toHaveBeenCalledOnce();
        });

        it("should not stop the scheduler before app.close()", async () => {
            const app = await buildApp();
            await app.ready();

            expect(mockSchedulerInstance.stop).not.toHaveBeenCalled();
        });

        it("should log info with correct metadata on close", async () => {
            const app = await buildApp();
            await app.ready();
            const logSpy = vi.spyOn(app.log, "info");
            await app.close();

            expect(logSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    context: "SystemScheduler",
                    jobName: "RefreshTokenCleanup",
                    status: "Stopped",
                }),
                expect.any(String),
            );
        });

        it("should await scheduler.stop() before logging (async order)", async () => {
            const callOrder: string[] = [];

            mockSchedulerInstance.stop = vi
                .fn()
                .mockImplementation(async () => {
                    callOrder.push("stop");
                });

            const app = await buildApp();
            await app.ready();

            const originalLogInfo = app.log.info.bind(app.log);
            vi.spyOn(app.log, "info").mockImplementation(
                (obj: any, msg?: any) => {
                    if (typeof obj === "object" && obj?.status === "Stopped") {
                        callOrder.push("log");
                    }
                    return originalLogInfo(obj, msg);
                },
            );

            await app.close();

            expect(callOrder).toEqual(["stop", "log"]);
        });
    });

    describe("Lifecycle order", () => {
        it("should call start before stop across full lifecycle", async () => {
            const callOrder: string[] = [];
            mockSchedulerInstance.start = vi
                .fn()
                .mockImplementation(() => callOrder.push("start"));
            mockSchedulerInstance.stop = vi
                .fn()
                .mockImplementation(async () => callOrder.push("stop"));

            const app = await buildApp();
            await app.ready();
            await app.close();

            expect(callOrder).toEqual(["start", "stop"]);
        });
    });

    describe("Plugin metadata", () => {
        it("should be wrapped with fastify-plugin (skip-override)", () => {
            expect(
                (refreshTokenCleanupPlugin as any)[Symbol.for("skip-override")],
            ).toBe(true);
        });
    });
});
