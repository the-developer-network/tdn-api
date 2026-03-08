import type { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import fastifyPlugin from "fastify-plugin";

const envSchema = {
    type: "object",
    required: [
        "PORT",
        "NODE_ENV",
        "DATABASE_URL",
        "ACCESS_TOKEN_SECRET_KEY",
        "COOKIE_SECRET",
    ],
    properties: {
        PORT: { type: "number", default: 3000 },
        NODE_ENV: {
            type: "string",
            enum: ["development", "test", "production"],
        },
        DATABASE_URL: { type: "string" },
        ACCESS_TOKEN_SECRET_KEY: { type: "string" },
        ACCESS_TOKEN_EXPIRES_IN: { type: "number", default: 900 },
        REFRESH_TOKEN_EXPIRES_IN: { type: "number", default: 90000 },
        COOKIE_SECRET: { type: "string" },
        REFRESH_TOKEN_CLEANUP_CRON: { type: "string" },
        REFRESH_TOKEN_CLEANUP_GRACE_PERIOD_HOURS: { type: "number" },
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
