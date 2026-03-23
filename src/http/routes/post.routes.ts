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

export function postRoutes(fastify: FastifyInstance): void {
    const { postController } = fastify.diContainer.cradle;

    fastify.post<{ Body: CreatePostBody }>(
        "/",
        {
            onRequest: [fastify.authenticate],
            schema: {
                body: createPostBodySchema,
            },
        },
        postController.create.bind(postController),
    );
    fastify.post(
        "/media",
        {
            onRequest: [fastify.authenticate],
        },
        postController.uploadMedia.bind(postController),
    );

    fastify.get<{ Querystring: GetPostsQuery }>(
        "/",
        {
            schema: {
                querystring: getPostsQuerySchema,
            },
        },
        postController.getFeed.bind(postController),
    );

    fastify.delete<{ Params: DeletePostParams }>(
        "/:id",
        {
            onRequest: [fastify.authenticate],
            schema: {
                params: deletePostParamsSchema,
            },
        },
        postController.deletePost.bind(postController),
    );
}
