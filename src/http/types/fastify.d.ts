import "fastify";
import type { PrismaClient } from "src/generated/prisma/client";
import { type EnvConfig } from "./schemas/env.schema";

declare module "fastify" {
    interface FastifyInstance {
        config: EnvConfig;
        prisma: PrismaClient;
        authenticate: (request: FastifyRequest) => Promise<void>;
        optionalAuthenticate: (request: FastifyRequest) => Promise<void>;
    }
}

export {};
