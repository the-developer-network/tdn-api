import type { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import fastifyPlugin from "fastify-plugin";
import { EnvSchema } from "@typings/schemas/env.schema";

function envPlugin(fastify: FastifyInstance): void {
    const isDevelopment = process.env.NODE_ENV === "development";

    fastify.register(fastifyEnv, {
        confKey: "config",
        schema: EnvSchema,
        dotenv: isDevelopment
            ? { path: `.env.${process.env.NODE_ENV}` }
            : false,
    });
}

export default fastifyPlugin(envPlugin, { name: "env-plugin" });
