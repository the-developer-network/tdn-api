import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import type { FastifyInstance } from "fastify";

export function oauthRoutes(fastify: FastifyInstance): void {
    const oauthController = fastify.diContainer.cradle.oauthController;

    fastify.get(
        "/github",
        {
            config: { rateLimit: RateLimitPolicies.STANDARD },
            schema: {
                tags: ["OAuth"],
            },
        },
        oauthController.github.bind(oauthController),
    );

    fastify.get<{ Querystring: { code?: string; error?: string } }>(
        "/github/callback",
        {
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: {
                tags: ["OAuth"],
            },
        },
        oauthController.githubCallback.bind(oauthController),
    );

    fastify.get(
        "/google",
        {
            config: { rateLimit: RateLimitPolicies.STANDARD },
            schema: {
                tags: ["OAuth"],
            },
        },
        oauthController.google.bind(oauthController),
    );

    fastify.get<{ Querystring: { code?: string; error?: string } }>(
        "/google/callback",
        {
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: {
                tags: ["OAuth"],
            },
        },
        oauthController.googleCallback.bind(oauthController),
    );
}

export default oauthRoutes;
