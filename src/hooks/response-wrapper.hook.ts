import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

function responseWrapperHook(
    server: FastifyInstance,
    _options: unknown,
    done: () => void,
): void {
    server.addHook(
        "preSerialization",
        async (
            _request: FastifyRequest,
            reply: FastifyReply,
            payload: unknown,
        ): Promise<unknown> => {
            if (reply.statusCode >= 400) {
                return payload;
            }

            if (payload instanceof Error || Buffer.isBuffer(payload)) {
                return payload;
            }

            if (
                payload &&
                typeof payload === "object" &&
                "data" in payload &&
                "meta" in payload
            ) {
                return payload;
            }

            const response = {
                data: payload,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            };

            return response;
        },
    );

    done();
}

export default fastifyPlugin(responseWrapperHook, {
    name: "global-response-wrapper",
});
