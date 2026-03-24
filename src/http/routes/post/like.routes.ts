/**
 * @module LikeRoutes
 * Like routes including like and unlike operations for posts.
 * @author TDN Team
 * @version 1.0.0
 */

import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    type LikePostParams,
    LikePostParamsSchema,
} from "@typings/schemas/post/like-post.schema";
import type { FastifyInstance } from "fastify";

/**
 * Sets up like routes on the Fastify instance
 *
 * Registers all like-related HTTP endpoints including:
 * - POST /:id/like - Like a post by ID
 * - DELETE /:id/unlike - Unlike a post by ID
 *
 * @param fastify - The Fastify application instance
 * @returns void
 */
export function likeRoutes(fastify: FastifyInstance): void {
    const { likeController } = fastify.diContainer.cradle;

    /**
     * Like a post by ID
     * Requires authentication and applies sensitive rate limiting
     */
    fastify.post<{ Params: LikePostParams }>(
        "/like",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: LikePostParamsSchema,
                tags: ["Like"],
            },
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        likeController.likePost.bind(likeController),
    );

    /**
     * Unlike a post by ID
     * Requires authentication and applies sensitive rate limiting
     */
    fastify.delete<{ Params: LikePostParams }>(
        "/unlike",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: LikePostParamsSchema,
                tags: ["Like"],
            },
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        likeController.unlikePost.bind(likeController),
    );
}
