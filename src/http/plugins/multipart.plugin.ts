import fastifyPlugin from "fastify-plugin";
import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";

function multipartPlugin(fastify: FastifyInstance): void {
    fastify.register(multipart, {
        limits: {
            fieldNameSize: 100,
            fieldSize: 100,
            fields: 10,
            fileSize: 5 * 1024 * 1024,
            files: 1,
        },
    });
}

export default fastifyPlugin(multipartPlugin, {
    name: "multipart-plugin",
});
