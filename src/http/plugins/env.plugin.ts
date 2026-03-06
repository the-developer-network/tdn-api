import type { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import fastifyPlugin from "fastify-plugin";

const envSchema = {
    type: "object",
    required: ["PORT", "NODE_ENV", "DATABASE_URL"],
    properties: {
        PORT: { type: "number", default: 3000 },
        NODE_ENV: {
            type: "string",
            enum: ["development", "test", "production"],
        },
        DATABASE_URL: { type: "string" },
        ACCESS_TOKEN_SECRET_KEY: { type: "string" },
        ACCESS_TOKEN_EXPIRES_IN: { type: "number", default: 900 },
    },
};

function envPlugin(fastify: FastifyInstance): void {
    const isDevelopment = process.env.NODE_ENV === "development";

    fastify.register(fastifyEnv, {
        confKey: "config",
        schema: envSchema,
        dotenv: isDevelopment
            ? { path: `.env.${process.env.NODE_ENV}` }
            : false,
    });
}

export default fastifyPlugin(envPlugin, { name: "env-plugin" });
