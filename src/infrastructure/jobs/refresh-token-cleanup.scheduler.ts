import type { FastifyBaseLogger } from "fastify";
import cron, { type ScheduledTask } from "node-cron";
import { type RefreshTokenCleanupJob } from "./refresh-token-cleanup.job";

export interface RefreshTokenCleanupSchedulerOptions {
    cronExpression: string;
    gracePeriodHours: number;
}

export class RefreshTokenCleanupScheduler {
    private task?: ScheduledTask;

    constructor(
        private readonly job: RefreshTokenCleanupJob,
        private readonly options: RefreshTokenCleanupSchedulerOptions,
        private readonly logger: FastifyBaseLogger,
    ) {}

    start(): void {
        if (this.task) return;

        this.task = cron.schedule(this.options.cronExpression, () => {
            void (async (): Promise<void> => {
                try {
                    const deletedCount = await this.job.run({
                        gracePeriodHours: this.options.gracePeriodHours,
                    });

                    this.logger.info(
                        {
                            job: "refresh-token-cleanup",
                            deletedCount,
                            gracePeriodHours: this.options.gracePeriodHours,
                            cronExpression: this.options.cronExpression,
                        },
                        "Refresh token cleanup completed",
                    );
                } catch (error) {
                    this.logger.error(
                        {
                            job: "refresh-token-cleanup",
                            gracePeriodHours: this.options.gracePeriodHours,
                            cronExpression: this.options.cronExpression,
                            error,
                        },
                        "Refresh token cleanup failed",
                    );
                }
            })();
        });
    }

    async stop(): Promise<void> {
        if (!this.task) return;

        await this.task.stop();
        this.task = undefined;
    }
}
