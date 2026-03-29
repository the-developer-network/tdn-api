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
    type GetPostParams,
    getPostParamsSchema,
} from "@typings/schemas/post/get-post.schema";
import {
    getPostsQuerySchema,
    type GetPostsQuery,
} from "@typings/schemas/post/get-posts.schema";
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
        "/posts",
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
        "/posts",
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
        "/posts/:id",
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

    fastify.get<{ Params: GetPostParams }>(
        "/posts/:id",
        {
            schema: {
                params: getPostParamsSchema,
                tags: ["Post"],
            },
            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        postController.getPost.bind(postController),
    );
}
