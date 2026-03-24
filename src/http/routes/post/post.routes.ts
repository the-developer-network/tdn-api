/**
 * @module PostRoutes
 * Post routes including create, delete, get feed and upload media.
 * @author TDN Team
 * @version 1.0.0
 */

import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    type CreatePostBody,
    createPostBodySchema,
} from "@typings/schemas/post/create-post.schema";
import {
    type DeletePostParams,
    deletePostParamsSchema,
} from "@typings/schemas/post/delete-post.schema";
import {
    getPostsQuerySchema,
    type GetPostsQuery,
} from "@typings/schemas/post/get-post.schema";
import {
    type LikePostParams,
    LikePostParamsSchema,
} from "@typings/schemas/post/like-post.schema";
import type { FastifyInstance } from "fastify";

/**
 * Sets up post routes on the Fastify instance
 *
 * Registers all post-related HTTP endpoints including:
 * - POST / - Create a new post
 * - POST /media - Upload media files for posts
 * - GET / - Retrieve paginated post feed
 * - DELETE /:id - Delete a post by ID
 * - POST /:id/like - Like a post by ID
 *
 * @param fastify - The Fastify application instance
 * @returns void
 */
export function postRoutes(fastify: FastifyInstance): void {
    const { postController } = fastify.diContainer.cradle;

    /**
     * Create a new post
     * Requires authentication and applies sensitive rate limiting
     */
    fastify.post<{ Body: CreatePostBody }>(
        "/",
        {
            onRequest: [fastify.authenticate],
            schema: {
                body: createPostBodySchema,
                tags: ["Post"],
            },
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        postController.create.bind(postController),
    );

    /**
     * Upload media files for a post
     * Requires authentication and applies sensitive rate limiting
     */
    fastify.post(
        "/media",
        {
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
            schema: {
                tags: ["Post"],
            },
        },
        postController.uploadMedia.bind(postController),
    );

    /**
     * Retrieve paginated post feed
     * Applies standard rate limiting
     */
    fastify.get<{ Querystring: GetPostsQuery }>(
        "/",
        {
            schema: {
                querystring: getPostsQuerySchema,
                tags: ["Post"],
            },
            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        postController.getFeed.bind(postController),
    );

    /**
     * Delete a post by ID
     * Requires authentication and applies sensitive rate limiting
     */
    fastify.delete<{ Params: DeletePostParams }>(
        "/:id",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: deletePostParamsSchema,
                tags: ["Post"],
            },
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        postController.deletePost.bind(postController),
    );

    /**
     * Like a post by ID
     * Requires authentication and applies sensitive rate limiting
     */
    fastify.post<{ Params: LikePostParams }>(
        "/:id/like",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: LikePostParamsSchema,
                tags: ["Post"],
            },
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        postController.likePost.bind(postController),
    );

    /**
     * Unlike a post by ID
     * Requires authentication and applies sensitive rate limiting
     */
    fastify.delete<{ Params: LikePostParams }>(
        "/:id/unlike",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: LikePostParamsSchema,
                tags: ["Post"],
            },
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        postController.unlikePost.bind(postController),
    );
}
