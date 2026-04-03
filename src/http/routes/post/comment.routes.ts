/**
 * @module CommentRoutes
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

export function commentRoutes(fastify: FastifyInstance): void {
    const { commentController } = fastify.diContainer.cradle;

    fastify.post<{ Params: CreateCommentParams; Body: CreateCommentBody }>(
        "/posts/:postId/comments",
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

    fastify.get<{
        Params: GetPostCommentsParams;
        Querystring: GetPostCommentsQuery;
    }>(
        "/posts/:postId/comments",
        {
            onRequest: [fastify.optionalAuthenticate],
            schema: {
                params: getPostCommentsParamsSchema,
                querystring: getPostCommentsQuerySchema,
                tags: ["Post", "Comment"],
            },

            config: { rateLimit: RateLimitPolicies.PUBLIC },
        },
        commentController.getPostComments.bind(commentController),
    );

    fastify.delete<{ Params: DeleteCommentParams; Reply: { 204: void } }>(
        "/comments/:commentId",
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

    fastify.post<{ Params: CommentActionParams }>(
        "/comments/:commentId/like",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: commentActionParamsSchema,
                tags: ["Comment", "Interaction"],
            },

            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        commentController.likeComment.bind(commentController),
    );

    fastify.delete<{ Params: CommentActionParams }>(
        "/comments/:commentId/unlike",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: commentActionParamsSchema,
                tags: ["Comment", "Interaction"],
            },
            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        commentController.unlikeComment.bind(commentController),
    );

    fastify.post<{ Params: CommentActionParams }>(
        "/comments/:commentId/save",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: commentActionParamsSchema,
                tags: ["Comment", "Bookmark"],
            },
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        fastify.diContainer.cradle.bookmarkController.saveComment.bind(
            fastify.diContainer.cradle.bookmarkController,
        ),
    );

    fastify.delete<{ Params: CommentActionParams }>(
        "/comments/:commentId/unsave",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: commentActionParamsSchema,
                tags: ["Comment", "Bookmark"],
            },
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        fastify.diContainer.cradle.bookmarkController.removeComment.bind(
            fastify.diContainer.cradle.bookmarkController,
        ),
    );
}
