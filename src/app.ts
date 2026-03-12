import Fastify, { type FastifyInstance } from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import envPlugin from "@plugins/env.plugin";
import jwtPlugin from "@plugins/jwt.plugin";
import cookiePlguin from "@plugins/cookie.plugin";
import rateLimitPlugin from "@plugins/rate-limit.plugin";
import corsPlugin from "@plugins/cors.plugin";
import helmetPlugin from "@plugins/helmet.plugin";
import errorHandlerPlugin from "@plugins/custom/error-handler.plugin";
import prismaPlugin from "@plugins/custom/prisma.plugin";
import refreshTokenCleanupPlugin from "@plugins/custom/refresh-token-cleanup.plugin";
import userServiceDecorator from "@decorators/auth-service.decorator";
import authenticateDecorator from "@decorators/authenticate.decorator";
import healthRoutes from "@routes/health.route";
import authRoutes from "@routes/auth.route";

/**
 * Main Application class responsible for orchestrating the Fastify server lifecycle.
 * It handles plugin registration, decorator injection, and route mounting.
 */
export class App {
    /** @private The underlying Fastify instance */
    private readonly server: FastifyInstance;

    /**
     * Initializes the Fastify instance with environment-aware logging.
     * @constructor
     */
    constructor() {
        const isDevelopment = process.env.NODE_ENV === "development";

        this.server = Fastify({
            allowErrorHandlerOverride: true,
            logger: isDevelopment
                ? {
                      transport: {
                          target: "pino-pretty",
                          options: {
                              translateTime: "HH:MM:ss Z",
                              ignore: "pid,hostname",
                          },
                      },
                  }
                : true,
        }).withTypeProvider<TypeBoxTypeProvider>();
    }

    /**
     * Registers foundational Fastify ecosystem plugins.
     * These include security, session, and environment configurations.
     * @private
     * @async
     */
    private async registerPlugins(): Promise<void> {
        await this.server.register(envPlugin);
        await this.server.after(); // Essential to load config before subsequent plugins

        this.server.register(cookiePlguin);
        this.server.register(jwtPlugin);
        this.server.register(rateLimitPlugin);
        this.server.register(corsPlugin);
        this.server.register(helmetPlugin);
    }

    /**
     * Registers internal custom-built plugins.
     * Handles global error logic, database connectivity, and cleanup jobs.
     * @private
     */
    private registerCustomPlugins(): void {
        this.server.register(errorHandlerPlugin);
        this.server.register(prismaPlugin);
        this.server.register(refreshTokenCleanupPlugin);
    }

    /**
     * Injects custom decorators into the Fastify instance.
     * Typically used for service-layer facades and auth hooks.
     * @private
     */
    private registerDecorators(): void {
        this.server.register(userServiceDecorator);
        this.server.register(authenticateDecorator);
    }

    /**
     * Mounts all API routes with versioned prefixes.
     * Organizes the endpoint hierarchy of the application.
     * @private
     */
    private registerRoutes(): void {
        this.server.register(healthRoutes, { prefix: "/api/v1" });
        this.server.register(authRoutes, { prefix: "/api/v1/auth" });
    }

    /**
     * Bootstraps the application components without starting the network listener.
     * Ideal for E2E testing using server.inject().
     * @public
     * @async
     * @returns {Promise<FastifyInstance>} The fully initialized Fastify instance.
     */
    public async init(): Promise<FastifyInstance> {
        await this.registerPlugins();
        this.registerCustomPlugins();
        this.registerDecorators();
        this.registerRoutes();

        await this.server.ready();
        return this.server;
    }

    /**
     * Starts the HTTP server and begins listening for incoming requests.
     * Orchestrates the full bootstrap process and binds to the configured port.
     * @public
     * @async
     * @returns {Promise<void>}
     */
    public async start(): Promise<void> {
        try {
            await this.init();
            await this.server.listen({
                port: this.server.config.PORT,
                host: "0.0.0.0",
            });
            this.server.log.info(
                `Server listening on port ${this.server.config.PORT}`,
            );
        } catch (err) {
            this.server.log.error(err);
            process.exit(1);
        }
    }

    /**
     * Getter for the Fastify instance.
     * Useful for accessing the server's internal state or configuration.
     * @public
     * @returns {FastifyInstance}
     */
    public get instance(): FastifyInstance {
        return this.server;
    }
}
