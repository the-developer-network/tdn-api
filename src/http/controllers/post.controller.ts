import { MediaLimitExceededError, NoMediaProvidedError } from "@core/errors";
import type { CreatePostUseCase } from "@core/use-cases/post/create-post";
import type { DeletePostUseCase } from "@core/use-cases/post/delete-post";
import type { GetPostDetailUseCase } from "@core/use-cases/post/get-post-detail/get-post-detail.usecase";
import type { GetPostsUseCase } from "@core/use-cases/post/get-posts";
import type { UploadPostMediaUseCase } from "@core/use-cases/post/upload-post-media";
import { PostPrismaMapper } from "@infrastructure/persistence/mappers/post-prisma.mapper";
import type { CreatePostBody } from "@typings/schemas/post/create-post.schema";
import type { DeletePostParams } from "@typings/schemas/post/delete-post.schema";
import type { GetPostParams } from "@typings/schemas/post/get-post.schema";
import type { GetPostsQuery } from "@typings/schemas/post/get-posts.schema";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Controller for handling post-related HTTP requests
 *
 * Manages the HTTP layer for post operations including creation, media upload,
 * feed retrieval, deletion, and liking posts. This controller acts as the
 * interface between HTTP requests and the underlying use cases.
 */
export class PostController {
    /**
     * Creates a new PostController instance
     * @param createPostUseCase - Use case for creating posts
     * @param uploadPostMediaUseCase - Use case for uploading post media
     * @param getPostsUseCase - Use case for retrieving posts
     * @param deletePostUseCase - Use case for deleting posts
     */
    constructor(
        private readonly createPostUseCase: CreatePostUseCase,
        private readonly uploadPostMediaUseCase: UploadPostMediaUseCase,
        private readonly getPostsUseCase: GetPostsUseCase,
        private readonly deletePostUseCase: DeletePostUseCase,
        private readonly getPostDetailUseCase: GetPostDetailUseCase,
    ) {}

    /**
     * Creates a new post
     * @param request - HTTP request containing post creation data
     * @param reply - HTTP response object
     */
    async create(
        request: FastifyRequest<{ Body: CreatePostBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const authorId = request.user.id;
        const { content, type, mediaUrls } = request.body;

        const post = await this.createPostUseCase.execute({
            authorId,
            content,
            type,
            mediaUrls,
        });

        return reply.status(201).send({
            data: PostPrismaMapper.toResponse(
                post,
                request.server.config.R2_PUBLIC_URL,
                authorId,
            ),
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Uploads media files for a post
     * @param request - HTTP request containing multipart form data with media files
     * @param reply - HTTP response object
     */
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

    /**
     * Retrieves a paginated feed of posts
     * @param request - HTTP request containing pagination and filtering parameters
     * @param reply - HTTP response object
     */
    async getFeed(
        request: FastifyRequest<{ Querystring: GetPostsQuery }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { page = 1, limit = 10, type, tag, followedOnly } = request.query;

        const cdnUrl = request.server.config.R2_PUBLIC_URL;

        const result = await this.getPostsUseCase.execute({
            page,
            limit,
            type,
            tag,
            followedOnly,
            currentUserId: request.user?.id,
        });

        const formattedData = PostPrismaMapper.toFeedResponse(
            result.posts,
            cdnUrl,
            request.user?.id,
        );

        const totalPages = Math.ceil(result.total / limit);

        return reply.status(200).send({
            data: formattedData,
            meta: {
                total: result.total,
                currentPage: page,
                limit,
                totalPages,
            },
        });
    }

    /**
     * Deletes a post by ID
     * @param request - HTTP request containing the post ID to delete
     * @param reply - HTTP response object
     */
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

    async getPost(
        request: FastifyRequest<{ Params: GetPostParams }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { id } = request.params;
        const userId = request.user?.id;

        const cdnUrl = request.server.config.R2_PUBLIC_URL;

        const post = await this.getPostDetailUseCase.execute(id, userId);

        const formattedData = PostPrismaMapper.toResponse(post, cdnUrl, userId);

        return reply.status(200).send({
            data: formattedData,
        });
    }
}
