import { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifyPlugin from "fastify-plugin";

/**
 * CORS Plugin for handling cross-origin requests.
 * Supports both single and comma-separated multiple origins from env config.
 */
async function corsPlugin(fastify: FastifyInstance): Promise<void> {
    const origins = fastify.config.CORS_ORIGIN.split(",").map((origin) =>
        origin.trim(),
    );

    await fastify.register(cors, {
        origin: origins,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
        maxAge: 86400,
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: [
            "Retry-After",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
        ],
    });
}

export default fastifyPlugin(corsPlugin);
