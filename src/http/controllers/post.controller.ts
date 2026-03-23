import { MediaLimitExceededError, NoMediaProvidedError } from "@core/errors";
import type { CreatePostUseCase } from "@core/use-cases/post/create-post";
import type { DeletePostUseCase } from "@core/use-cases/post/delete-post";
import type { GetPostsUseCase } from "@core/use-cases/post/get-post";
import type { UploadPostMediaUseCase } from "@core/use-cases/post/upload-post-media";
import type { CreatePostBody } from "@typings/schemas/post/create-post.schema";
import type { DeletePostParams } from "@typings/schemas/post/delete-post.schema";
import type { GetPostsQuery } from "@typings/schemas/post/get-post.schema";
import type { FastifyReply, FastifyRequest } from "fastify";

export default class PostController {
    constructor(
        private readonly createPostUseCase: CreatePostUseCase,
        private readonly uploadPostMediaUseCase: UploadPostMediaUseCase,
        private readonly getPostsUseCase: GetPostsUseCase,
        private readonly deletePostUseCase: DeletePostUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreatePostBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const authorId = request.user.id;
        const { content, type, mediaUrls } = request.body;

        await this.createPostUseCase.execute({
            authorId,
            content,
            type,
            mediaUrls,
        });

        return reply.status(201).send({
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    async uploadMedia(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        if (!request.isMultipart()) {
            throw new NoMediaProvidedError(
                "Please send a multipart/form-data request with at least one media file.",
            );
        }

        const userId = request.user.id;
        const r2PublicUrl = request.server.config.R2_PUBLIC_URL;

        const files = request.files();
        const uploadedUrls: string[] = [];
        let fileCount = 0;

        for await (const part of files) {
            fileCount++;

            if (fileCount > 4) {
                throw new MediaLimitExceededError();
            }

            const fileBuffer = await part.toBuffer();

            const uploadedPath = await this.uploadPostMediaUseCase.execute({
                userId,
                fileBuffer,
                mimeType: part.mimetype,
                originalFileName: part.filename,
            });

            const fullUrl = `${r2PublicUrl}/${uploadedPath}`;
            uploadedUrls.push(fullUrl);
        }

        if (uploadedUrls.length === 0) {
            throw new NoMediaProvidedError();
        }

        return reply.status(200).send({
            data: {
                mediaUrls: uploadedUrls,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    async getFeed(
        request: FastifyRequest<{ Querystring: GetPostsQuery }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { page, limit, type } = request.query;

        const cdnUrl = request.server.config.R2_PUBLIC_URL;

        const result = await this.getPostsUseCase.execute({
            page,
            limit,
            type,
        });

        const formattedData = result.data.map((post) => {
            return {
                ...post,
                author: {
                    ...post.author,

                    avatarUrl: post.author.avatarUrl.startsWith("http")
                        ? post.author.avatarUrl
                        : `${cdnUrl}/${post.author.avatarUrl}`,
                },
            };
        });

        return reply.status(200).send({
            data: formattedData,
            meta: result.meta,
        });
    }

    async deletePost(
        request: FastifyRequest<{ Params: DeletePostParams }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;
        const postId = request.params.id;

        let cdnBaseUrl = request.server.config.R2_PUBLIC_URL;

        if (cdnBaseUrl.endsWith("/")) {
            cdnBaseUrl = cdnBaseUrl.slice(0, -1);
        }

        await this.deletePostUseCase.execute({
            postId,
            userId,
            cdnBaseUrl,
        });

        return reply.status(204).send();
    }
}
