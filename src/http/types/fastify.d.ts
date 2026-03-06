import "fastify";
import type { AuthService } from "src/http/services/auth.service";
import type { PrismaClient } from "src/generated/prisma/client";

declare module "fastify" {
    interface FastifyInstance {
        config: {
            PORT: number;
            NODE_ENV: "test" | "development" | "production";
            DATABASE_URL: string;
            ACCESS_TOKEN_SECRET_KEY: string;
            ACCESS_TOKEN_EXPIRES_IN: number;
        };
        prisma: PrismaClient;
        authService: AuthService;
    }
}

export {};
