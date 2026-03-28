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
import {
    type DeleteCommentParams,
    deleteCommentParamsSchema,
} from "@typings/schemas/comment/delete-comment.schema";
import {
    type GetPostCommentsParams,
    getPostCommentsParamsSchema,
    type GetPostCommentsQuery,
    getPostCommentsQuerySchema,
} from "@typings/schemas/comment/get-post-comments.schema";
import {
    type CommentActionParams,
    commentActionParamsSchema,
} from "@typings/schemas/comment/like-comment.schema";
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

    fastify.delete<{ Params: DeleteCommentParams; Reply: { 204: void } }>(
        "/:commentId",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: deleteCommentParamsSchema,
                tags: ["Comment"],
            },
            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        commentController.delete.bind(commentController),
    );
    fastify.get<{
        Params: GetPostCommentsParams;
        Querystring: GetPostCommentsQuery;
    }>(
        "/:id/comments",
        {
            schema: {
                params: getPostCommentsParamsSchema,
                querystring: getPostCommentsQuerySchema,
                tags: ["Post", "Comment"],
            },
        },
        commentController.getPostComments.bind(commentController),
    );

    fastify.post<{ Params: CommentActionParams }>(
        "/:id/like",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: commentActionParamsSchema,
                tags: ["Comment", "Interaction"],
            },
        },
        commentController.likeComment.bind(commentController),
    );

    fastify.delete<{ Params: CommentActionParams }>(
        "/:id/unlike",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: commentActionParamsSchema,
                tags: ["Comment", "Interaction"],
            },
        },
        commentController.unlikeComment.bind(commentController),
    );
}
