/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { randomBytes, createHash } from "node:crypto";
import { createDatabaseClient } from "@infrastructure/persistence/database/database.client";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import "dotenv/config";

/**
 * Generates a unique token string for a bot.
 *
 * The token is prefixed with "tdn_bot_" followed by a 32-byte random hexadecimal string.
 *
 * @returns {string} The generated bot token.
 */
function createToken(): string {
    const token = "tdn_bot_" + randomBytes(32).toString("hex");
    return token;
}

/**
 * Asynchronously establishes a connection to the database using the URL specified
 * in the `DATABASE_URL` environment variable.
 *
 * @returns {Promise<ReturnType<typeof createDatabaseClient>>} A promise that resolves to the connected database client.
 * @throws {Error} If the `DATABASE_URL` environment variable is not set.
 */
async function connect(): Promise<ReturnType<typeof createDatabaseClient>> {
    if (!process.env.DATABASE_URL)
        throw new Error("DATABASE_URL environment variable is not set.");

    const client = createDatabaseClient(process.env.DATABASE_URL);

    await client.$connect();
    return client;
}

/**
 * Retrieves all users from the database who are marked as bots.
 *
 * @param prisma - The Prisma client instance used to query the database.
 * @returns A promise that resolves to an array of bot users.
 * @throws {Error} If no bot users are found in the database.
 */
async function getBots(
    prisma: ReturnType<typeof createDatabaseClient>,
): Promise<import("@generated/prisma/client").User[]> {
    const users = await prisma.user.findMany({
        where: {
            isBot: true,
        },
    });

    if (users.length === 0)
        throw new Error("No bot users found in the database.");
    return users;
}

/**
 * Generates a SHA-256 hash of the provided token string.
 *
 * @param token - The input string to be hashed.
 * @returns The hexadecimal representation of the hashed token.
 */
function hashToken(token: string): string {
    const hashedToken = createHash("sha256").update(token).digest("hex");
    return hashedToken;
}

/**
 * Updates the botToken for each provided bot user, generates a new token,
 * hashes it, and updates the user record in the database. Stores the plain
 * tokens in a local JSON file, merging with any existing tokens.
 *
 * @param prisma - The Prisma client instance used for database operations.
 * @param bots - An array of User objects representing the bots to update.
 * @returns A promise that resolves to an array of updated User objects.
 */
async function updateBots(
    prisma: ReturnType<typeof createDatabaseClient>,
    bots: import("@generated/prisma/client").User[],
): Promise<import("@generated/prisma/client").User[]> {
    const tokensMap: Record<string, string> = {};

    const updatedBots = await Promise.all(
        bots.map(async (bot) => {
            const token = createToken();
            const updatedBot = await prisma.user.update({
                where: { id: bot.id },
                data: { botToken: hashToken(token) },
            });

            tokensMap[bot.username] = token;
            return updatedBot;
        }),
    );

    writeTokensToFile(tokensMap);
    return updatedBots;
}

/**
 * Writes the provided tokens to a JSON file, merging them with any existing tokens.
 *
 * If the file `bot-tokens-private.json` already exists, its contents are read and merged
 * with the new tokens. The resulting object is then written back to the file in a pretty-printed format.
 *
 * @param tokens - An object mapping token names to their string values.
 */
function writeTokensToFile(tokens: Record<string, string>): void {
    const filePath = "bot-tokens-private.json";
    let existingTokens: Record<string, string> = {};

    if (existsSync(filePath)) {
        existingTokens = JSON.parse(readFileSync(filePath, "utf-8"));
    }

    writeFileSync(
        filePath,
        JSON.stringify({ ...existingTokens, ...tokens }, null, 2),
        { encoding: "utf-8" },
    );
}

/**
 * Main entry point for the bot migration script.
 *
 * - Establishes a connection to the database using `connect`.
 * - Retrieves all bots using `getBots`.
 * - Updates the bots using `updateBots`.
 * - Logs the number of bots updated.
 * - Disconnects from the database.
 *
 * @async
 * @returns {Promise<void>} Resolves when the migration process is complete.
 */
async function main(): Promise<void> {
    const prisma = await connect();
    const bots = await getBots(prisma);
    const updatedBots = await updateBots(prisma, bots);
    console.log(updatedBots.length + " bots updated successfully.");
    await prisma.$disconnect();
}

main().catch((error) => {
    console.error("An error occurred while migrating bots:", error);
    process.exit(1);
});
