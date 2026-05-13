import { config } from "dotenv";
import { PrismaClient } from "../../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Creates a PrismaClient instance connected to the integration test database.
 * Reads DATABASE_URL from .env.test.
 */
export function createPrismaClient(): PrismaClient {
    const { parsed } = config({ path: ".env.test" });
    const connectionString = parsed?.DATABASE_URL ?? process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL is not set in .env.test");
    }

    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}
