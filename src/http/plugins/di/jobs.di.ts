import { asClass, asFunction } from "awilix";
import { UserPurgeJob } from "@infrastructure/jobs/user/user-purge.job";
import { RefreshTokenPurgeJob } from "@infrastructure/jobs/refresh-token/refresh-token-purge.job";
import { UserPurgeScheduler } from "@infrastructure/jobs/user/user-purge.scheduler";
import { RefreshTokenPurgeScheduler } from "@infrastructure/jobs/refresh-token/refresh-token-purge.scheduler";
import { NotificationPurgeJob } from "@infrastructure/jobs/notification/notification-purge.job";
import { NotificationPurgeScheduler } from "@infrastructure/jobs/notification/notification-purge.scheduler";

export const jobsModule = {
    // --- Jobs ---
    userPurgeJob: asClass(UserPurgeJob).singleton(),
    refreshTokenPurgeJob: asClass(RefreshTokenPurgeJob).singleton(),
    notificationPurgeJob: asClass(NotificationPurgeJob),

    // --- Schedulers ---
    userPurgeScheduler: asFunction((userPurgeJob, config, logger) => {
        return new UserPurgeScheduler(
            userPurgeJob,
            { cronExpression: config.USER_PURGE_CRON },
            logger,
        );
    }).singleton(),

    refreshTokenPurgeScheduler: asFunction(
        (refreshTokenPurgeJob, config, logger) => {
            return new RefreshTokenPurgeScheduler(
                refreshTokenPurgeJob,
                { cronExpression: config.REFRESH_TOKEN_PURGE_CRON },
                logger,
            );
        },
    ).singleton(),

    notificationPurgeScheduler: asFunction(
        (notificationPurgeJob, config, logger) => {
            return new NotificationPurgeScheduler(
                notificationPurgeJob,
                {
                    cronExpression: config.NOTIFICATION_PURGE_CRON,
                    gracePeriodDays:
                        config.NOTIFICATION_PURGE_GRACE_PERIOD_DAYS,
                },
                logger,
            );
        },
    ),
};
