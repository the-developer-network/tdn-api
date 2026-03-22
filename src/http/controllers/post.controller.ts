import { MediaLimitExceededError } from "@core/errors/media-limit-exceeded.error";
import { NoMediaProvidedError } from "@core/errors/no-media-provided.error";
import type { CreatePostUseCase } from "@core/use-cases/post/create-post/create-post.usecase";
import type { UploadPostMediaUseCase } from "@core/use-cases/post/upload-post-media/upload-post-media.usecase";
import type { CreatePostBody } from "@typings/schemas/post/create-post.schema";
import type { FastifyReply, FastifyRequest } from "fastify";

export default class PostController {
    constructor(
        private readonly createPostUseCase: CreatePostUseCase,
        private readonly uploadPostMediaUseCase: UploadPostMediaUseCase,
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
}
