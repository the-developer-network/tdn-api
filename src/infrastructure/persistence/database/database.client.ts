import { PrismaClient } from "@generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export function createDatabaseClient(connectionString: string): PrismaClient {
    const adapter = new PrismaPg({
        connectionString,
    });

    return new PrismaClient({
        adapter,
    });
}
