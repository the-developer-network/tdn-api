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
import type { FastifyInstance } from "fastify";

/**
 * Sets up post routes on the Fastify instance
 *
 * @param fastify - The Fastify application instance
 * @returns void
 */
export function postRoutes(fastify: FastifyInstance): void {
    const { postController } = fastify.diContainer.cradle;

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
}
