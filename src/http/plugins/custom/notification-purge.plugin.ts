import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

function notificationPurgePlugin(fastify: FastifyInstance): void {
    const notificationPurgeCleanupScheduler =
        fastify.diContainer.cradle.notificationPurgeScheduler;

    fastify.addHook("onReady", () => {
        notificationPurgeCleanupScheduler.start();

        fastify.log.info(
            {
                context: "SystemScheduler",
                jobName: "NotificationPurge",
                status: "Started",
                config: {
                    cronExpression: fastify.config.NOTIFICATION_PURGE_CRON,
                    retentionDays:
                        fastify.config.NOTIFICATION_PURGE_GRACE_PERIOD_DAYS,
                },
            },
            "Notification purge scheduler initialized and started successfully.",
        );
    });

    fastify.addHook("onClose", async () => {
        await notificationPurgeCleanupScheduler.stop();

        fastify.log.info(
            {
                context: "SystemScheduler",
                jobName: "NotificationPurgeCleanup",
                status: "Stopped",
            },
            "Notification purge cleanup scheduler stopped safely.",
        );
    });
}

export default fastifyPlugin(notificationPurgePlugin, {
    name: "notification-purge-plugin",
    dependencies: ["di-plugin", "prisma-plugin", "env-plugin"],
});
