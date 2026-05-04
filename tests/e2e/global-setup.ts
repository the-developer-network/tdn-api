import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { config } from "dotenv";
import argon2 from "argon2";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { BOT_USER } from "./test-constants";

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
        const hashedPassword = await argon2.hash(BOT_USER.password, {
            type: argon2.argon2i,
        });
        const hashedToken = createHash("sha256")
            .update(BOT_USER.plainToken)
            .digest("hex");

        await prisma.user.create({
            data: {
                email: BOT_USER.email,
                username: BOT_USER.username,
                password: hashedPassword,
                isBot: true,
                isEmailVerified: true,
                botToken: hashedToken,
                profile: {
                    create: {
                        fullName: BOT_USER.fullName,
                    },
                },
            },
        });
    } finally {
        await prisma.$disconnect();
    }
}
