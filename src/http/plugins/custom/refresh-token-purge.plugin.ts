import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

function refreshTokenPurge(fastify: FastifyInstance): void {
    const refreshTokenCleanupScheduler =
        fastify.diContainer.cradle.refreshTokenPurgeScheduler;

    fastify.addHook("onReady", () => {
        refreshTokenCleanupScheduler.start();

        fastify.log.info(
            {
                context: "SystemScheduler",
                jobName: "RefreshTokenPurge",
                status: "Started",
                config: {
                    cronExpression: fastify.config.REFRESH_TOKEN_PURGE_CRON,
                    gracePeriodHours:
                        fastify.config.REFRESH_TOKEN_PURGE_GRACE_PERIOD_DAYS,
                },
            },
            "Refresh token purge scheduler initialized and started successfully.",
        );
    });

    fastify.addHook("onClose", async () => {
        await refreshTokenCleanupScheduler.stop();

        fastify.log.info(
            {
                context: "SystemScheduler",
                jobName: "RefreshTokenCleanup",
                status: "Stopped",
            },
            "Refresh token cleanup scheduler stopped safely.",
        );
    });
}

export default fastifyPlugin(refreshTokenPurge, {
    name: "refresh-token-purge-plugin",
    dependencies: ["env-plugin", "prisma-plugin", "di-plugin"],
});
