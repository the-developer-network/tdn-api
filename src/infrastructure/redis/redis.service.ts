import Redis from "ioredis";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";

export class RedisService {
    public readonly publisher: Redis;
    public readonly subscriber: Redis;
    private readonly logger: FastifyBaseLogger;

    constructor(logger: FastifyBaseLogger, config: FastifyInstance["config"]) {
        this.logger = logger;
        const redisUrl = config.REDIS_URL;

        this.publisher = new Redis(redisUrl);

        this.subscriber = this.publisher.duplicate();

        this.setupListeners();
    }

    private setupListeners(): void {
        this.publisher.on("connect", () => {
            this.logger.info(
                { event: "redis_publisher_connected" },
                "Redis Publisher connected",
            );
        });
        this.subscriber.on("connect", () => {
            this.logger.info(
                { event: "redis_subscriber_connected" },
                "Redis Subscriber connected",
            );
        });
        this.publisher.on("error", (err) => {
            this.logger.error(
                { event: "redis_publisher_error", error: err.message },
                "Redis Publisher Error",
            );
        });
        this.subscriber.on("error", (err) => {
            this.logger.error(
                { event: "redis_subscriber_error", error: err.message },
                "Redis Subscriber Error",
            );
        });
    }

    async disconnect(): Promise<void> {
        await this.publisher.quit();
        await this.subscriber.quit();
    }
}
