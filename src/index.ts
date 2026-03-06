import Fastify from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

// Plugins
import envPlugin from "@plugins/env.plugin";
import jwtPlugin from "@plugins/jwt.plugin";

// Hooks
import responseWrapperHook from "@hooks/response-wrapper.hook";

// Custom Plugins
import errorHandlerPlugin from "@plugins/custom/error-handler.plugin";
import prismaPlugin from "@plugins/custom/prisma.plugin";

//Decorators
import userServiceDecorator from "@decorators/auth-service.decorator";

// Routes
import healthRoutes from "@routes/health.route";
import authRoutes from "@routes/auth.route";

const isDevelopment = process.env.NODE_ENV === "development";

const server = Fastify({
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

/**
 * Registers core Fastify ecosystem plugins.
 * These are typically third-party or foundational environment plugins.
 */
async function registerPlugins(): Promise<void> {
    server.register(envPlugin);
    await server.after();
    server.register(jwtPlugin);
}

/**
 * Registers custom internal plugins.
 * Includes project-specific logic like global error handling.
 */
function registerCustomPlugins(): void {
    server.register(errorHandlerPlugin);
    server.register(prismaPlugin);
}

/**
 * Registers global lifecycle hooks.
 * Used for intercepting and transforming requests or responses.
 */
function registerHooks(): void {
    server.register(responseWrapperHook);
}

/**
 * Registers application API routes.
 * Applies versioning prefixes to organize endpoints.
 */
function registerRoutes(): void {
    server.register(healthRoutes, { prefix: "/api/v1" });
    server.register(authRoutes, { prefix: "/api/v1/auth" });
}

/**
 * Registers Fastify decorators (e.g. service layer facades).
 * Must run after required plugins (like Prisma) so decorators can use fastify.prisma, config, etc.
 */
function registerDecorators(): void {
    server.register(userServiceDecorator);
}
/**
 * Initializes and starts the Fastify server.
 * Orchestrates plugin registration, hook setup, and route mounting
 * before binding to the specified port.
 * * @returns {Promise<void>}
 */
async function startServer(): Promise<void> {
    try {
        await registerPlugins();
        registerCustomPlugins();
        registerDecorators();
        registerHooks();
        registerRoutes();

        await server.after();

        await server.listen({ port: server.config.PORT, host: "0.0.0.0" });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

// Entry point execution
void startServer();
