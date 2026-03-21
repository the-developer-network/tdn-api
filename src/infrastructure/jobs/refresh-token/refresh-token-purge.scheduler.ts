import type { FastifyBaseLogger } from "fastify";
import cron, { type ScheduledTask } from "node-cron";
import type { RefreshTokenPurgeJob } from "./refresh-token-purge.job";

export interface RefreshTokenPurgeSchedulerOptions {
    cronExpression: string;
}

export class RefreshTokenPurgeScheduler {
    private task?: ScheduledTask;

    constructor(
        private readonly job: RefreshTokenPurgeJob,
        private readonly options: RefreshTokenPurgeSchedulerOptions,
        private readonly logger: FastifyBaseLogger,
    ) {}
    start(): void {
        if (this.task) return;

        this.task = cron.schedule(
            this.options.cronExpression.trim(),
            () => {
                void (async (): Promise<void> => {
                    try {
                        const deletedCount = await this.job.run();

                        this.logger.info(
                            { job: "refresh-token-", deletedCount },
                            "Purge success",
                        );
                    } catch (error) {
                        this.logger.error(
                            { job: "refresh-token-", error },
                            "Purge failed",
                        );
                    }
                })();
            },
            {
                timezone: "Europe/Istanbul",
            },
        );
    }

    async stop(): Promise<void> {
        if (!this.task) return;

        await this.task.stop();
        this.task = undefined;
    }
}
