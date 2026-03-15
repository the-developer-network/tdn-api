import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

function userPurgePlugin(fastify: FastifyInstance): void {
    const userPurgeCleanupScheduler =
        fastify.diContainer.cradle.userPurgeScheduler;

    fastify.addHook("onReady", () => {
        userPurgeCleanupScheduler.start();

        fastify.log.info(
            {
                context: "SystemScheduler",
                jobName: "UserPurge",
                status: "Started",
                config: {
                    cronExpression: fastify.config.USER_PURGE_CRON,
                    gracePeriodDays:
                        fastify.config.USER_PURGE_GRACE_PERIOD_DAYS,
                },
            },
            "User purge scheduler initialized and started successfully.",
        );
    });

    fastify.addHook("onClose", async () => {
        await userPurgeCleanupScheduler.stop();

        fastify.log.info(
            {
                context: "SystemScheduler",
                jobName: "UserPurgeCleanup",
                status: "Stopped",
            },
            "User purge cleanup scheduler stopped safely.",
        );
    });
}

export default fastifyPlugin(userPurgePlugin, {
    name: "user-purge-plugin",
    dependencies: ["di-plugin", "prisma-plugin", "env-plugin"],
});
