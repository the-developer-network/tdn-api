/**
 * @module OAuthRoutes
 * OAuth routes including GitHub and Google authentication.
 * @author TDN Team
 * @version 1.0.0
 */

import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import type { FastifyInstance } from "fastify";

/**
 * Sets up OAuth routes on the Fastify instance
 *
 * @param fastify - The Fastify application instance
 * @returns void
 */
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
