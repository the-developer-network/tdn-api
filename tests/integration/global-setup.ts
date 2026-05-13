import { execSync } from "node:child_process";
import { config } from "dotenv";
import argon2 from "argon2";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export default async function setup(): Promise<void> {
    const { parsed } = config({ path: ".env.test" });
    execSync("pnpm prisma migrate reset --force", {
        stdio: "inherit",
        env: { ...process.env, ...parsed },
    });

    const connectionString = parsed?.DATABASE_URL ?? process.env.DATABASE_URL;
    if (!connectionString)
        throw new Error("DATABASE_URL is not set in .env.test");

    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter });

    try {
        // Seed a base integration test user (argon2id per OWASP)
        const hashedPassword = await argon2.hash("IntegrationPass123!", {
            type: argon2.argon2id,
        });

        await prisma.user.create({
            data: {
                email: "integration-seed@test.com",
                username: "integration_seed",
                password: hashedPassword,
                isEmailVerified: true,
                profile: {
                    create: {
                        fullName: "Integration Seed",
                    },
                },
            },
        });
    } finally {
        await prisma.$disconnect();
    }
}
