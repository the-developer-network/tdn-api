import fastifyPlugin from "fastify-plugin";
import fastifyRateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { TooManyRequestsError } from "@core/errors/too-many-requests.error";

export const RateLimitPolicies = {
    STRICT: {
        max: 3,
        timeWindow: "15 minutes",
        continueExceeding: true,
    },
    SENSITIVE: {
        max: 5,
        timeWindow: "1 minute",
    },
    STANDARD: {
        max: 60,
        timeWindow: "1 minute",
    },
};

function rateLimitPlugin(fastify: FastifyInstance): void {
    fastify.register(fastifyRateLimit, {
        global: true,
        max: 100,
        timeWindow: "1 minute",

        errorResponseBuilder: () => {
            throw new TooManyRequestsError();
        },
    });
}

export default fastifyPlugin(rateLimitPlugin);
