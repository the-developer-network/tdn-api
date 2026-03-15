import type { FastifyBaseLogger } from "fastify";
import cron, { type ScheduledTask } from "node-cron";
import type UserPurgeJob from "./user-purge.job";

export interface UserPurgeSchedulerOptions {
    cronExpression: string;
}

export class UserPurgeScheduler {
    private task?: ScheduledTask;

    constructor(
        private readonly job: UserPurgeJob,
        private readonly options: UserPurgeSchedulerOptions,
        private readonly logger: FastifyBaseLogger,
    ) {}

    start(): void {
        if (this.task) return;

        this.task = cron.schedule(
            this.options.cronExpression,
            () => {
                void (async (): Promise<void> => {
                    try {
                        const deletedCount = await this.job.run();

                        this.logger.info(
                            {
                                job: "user-purge-cleanup",
                                deletedCount,
                                cronExpression: this.options.cronExpression,
                            },
                            "User purge cleanup completed successfully",
                        );
                    } catch (error) {
                        this.logger.error(
                            {
                                job: "user-purge-cleanup",
                                error,
                            },
                            "User purge cleanup failed",
                        );
                    }
                })();
            },
            {
                timezone: "Europe/Istanbul",
            },
        );

        this.logger.info("User Purge Cleanup Scheduler initialized");
    }

    async stop(): Promise<void> {
        if (!this.task) return;
        await this.task.stop();
        this.task = undefined;
    }
}
