import type { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import fastifyPlugin from "fastify-plugin";

function helmetPlugin(fastify: FastifyInstance): void {
    fastify.register(helmet, {
        global: true,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "validator.swagger.io"],
            },
        },
    });
}

export default fastifyPlugin(helmetPlugin);
