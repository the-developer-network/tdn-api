import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { createDatabaseClient } from "@infrastructure/persistence/database/database.client";

async function prismaPlugin(fastify: FastifyInstance): Promise<void> {
    const client = createDatabaseClient(fastify.config.DATABASE_URL);

    fastify.decorate("prisma", client);
    await client.$connect();

    fastify.addHook("onClose", async (server) => {
        await server.prisma.$disconnect();
    });
}

export default fastifyPlugin(prismaPlugin, {
    name: "prisma-plugin",
});
