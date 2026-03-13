import "fastify";
import type { AuthService } from "@services/auth.controller";
import type { PrismaClient } from "src/generated/prisma/client";
import { type EnvConfig } from "./schemas/env.schema";

declare module "fastify" {
    interface FastifyInstance {
        config: EnvConfig;
        prisma: PrismaClient;
        authService: AuthService;
        authenticate: (request: FastifyRequest) => Promise<void>;
    }
}

export {};
