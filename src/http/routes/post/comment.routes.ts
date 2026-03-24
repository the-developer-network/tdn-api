/**
 * @module CommentRoutes
 * Comment routes including adding comments and replies to posts.
 * @author TDN Team
 * @version 1.0.0
 */

import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    createCommentBodySchema,
    createCommentParamsSchema,
    type CreateCommentBody,
    type CreateCommentParams,
} from "@typings/schemas/comment/create-comment.schema";
import { type FastifyInstance } from "fastify";

/**
 * Sets up comment routes on the Fastify instance
 *
 * Registers all comment-related HTTP endpoints including:
 * - POST /posts/:id/comments - Add a new comment or reply to a post
 *
 * @param fastify - The Fastify application instance
 * @returns void
 */
export function commentRoutes(fastify: FastifyInstance): void {
    const { commentController } = fastify.diContainer.cradle;

    /**
     * Create a new comment or reply
     * Requires authentication and applies standard rate limiting
     */
    fastify.post<{ Params: CreateCommentParams; Body: CreateCommentBody }>(
        "/",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: createCommentParamsSchema,
                body: createCommentBodySchema,
                tags: ["Comment"],
            },
            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        commentController.create.bind(commentController),
    );
}
