import { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifyPlugin from "fastify-plugin";

function corsPlugin(fastify: FastifyInstance): void {
    fastify.register(cors, {
        origin: fastify.config.CORS_ORIGIN,
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
