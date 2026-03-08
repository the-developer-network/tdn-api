import { CleanupRefreshTokensUseCase } from "@core/use-cases/cleanup-refresh-tokens.usecase.ts";
import { RefreshTokenCleanupJob } from "@infrastructure/jobs/refresh-token-cleanup.job";
import { RefreshTokenCleanupScheduler } from "@infrastructure/jobs/refresh-token-cleanup.scheduler";
import { PrismaRefreshTokenRepository } from "@infrastructure/repositories/prisma-refresh-token.repository";
import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

function refreshTokenCleanupPlugin(fastify: FastifyInstance): void {
    const refreshTokenRepository = new PrismaRefreshTokenRepository(
        fastify.prisma,
    );

    const cleanupRefreshTokensUseCase = new CleanupRefreshTokensUseCase(
        refreshTokenRepository,
    );

    const refreshTokenCleanupJob = new RefreshTokenCleanupJob(
        cleanupRefreshTokensUseCase,
    );

    const refreshTokenCleanupScheduler = new RefreshTokenCleanupScheduler(
        refreshTokenCleanupJob,
        {
            cronExpression: fastify.config.REFRESH_TOKEN_CLEANUP_CRON,
            gracePeriodHours:
                fastify.config.REFRESH_TOKEN_CLEANUP_GRACE_PERIOD_HOURS,
        },
        fastify.log,
    );

    refreshTokenCleanupScheduler.start();

    fastify.addHook("onClose", async () => {
        await refreshTokenCleanupScheduler.stop();
    });
}

export default fastifyPlugin(refreshTokenCleanupPlugin, {
    name: "refresh-token-cleanup-plugin",
});
