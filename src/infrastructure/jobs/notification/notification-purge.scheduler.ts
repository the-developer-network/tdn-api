import type { FastifyBaseLogger } from "fastify";
import cron, { type ScheduledTask } from "node-cron";
import type { NotificationPurgeJob } from "./notification-purge.job";

export interface NotificationPurgeSchedulerOptions {
    cronExpression: string;
    gracePeriodDays: number;
}

export class NotificationPurgeScheduler {
    private task?: ScheduledTask;

    constructor(
        private readonly job: NotificationPurgeJob,
        private readonly options: NotificationPurgeSchedulerOptions,
        private readonly logger: FastifyBaseLogger,
    ) {}

    start(): void {
        if (this.task) return;

        this.task = cron.schedule(this.options.cronExpression, () => {
            void (async (): Promise<void> => {
                try {
                    const deletedCount = await this.job.run(
                        this.options.gracePeriodDays,
                    );

                    this.logger.info(
                        {
                            job: "notification-purge-cleanup",
                            deletedCount,
                            cronExpression: this.options.cronExpression,
                            retentionDays: this.options.gracePeriodDays,
                        },
                        "Notification purge cleanup completed successfully",
                    );
                } catch (error) {
                    this.logger.error(
                        {
                            job: "notification-purge-cleanup",
                            error,
                        },
                        "Notification purge cleanup failed",
                    );
                }
            })();
        });

        this.logger.info("Notification Purge Cleanup Scheduler initialized");
    }

    stop(): void {
        if (!this.task) return;
        this.task = undefined;
    }
}
