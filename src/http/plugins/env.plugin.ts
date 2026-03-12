import type { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import fastifyPlugin from "fastify-plugin";
import { EnvSchema } from "@typings/schemas/env.schema";

function envPlugin(fastify: FastifyInstance): void {
    fastify.register(fastifyEnv, {
        confKey: "config",
        schema: EnvSchema,
        dotenv: { path: `.env.${process.env.NODE_ENV}` },
    });
}

export default fastifyPlugin(envPlugin, { name: "env-plugin" });
