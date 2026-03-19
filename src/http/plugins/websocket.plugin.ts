import fastifyPlugin from "fastify-plugin";
import fastifyWebsocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";

function websocketPlugin(fastify: FastifyInstance): void {
    fastify.register(fastifyWebsocket, {
        options: {
            maxPayload: 1048576,
        },
    });
}

export default fastifyPlugin(websocketPlugin, {
    name: "websocket-plugin",
});
