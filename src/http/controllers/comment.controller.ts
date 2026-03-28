/**
 * Controller for handling comment-related HTTP requests
 * Manages creation of comments and nested comments
 */
import type { CreateCommentUseCase } from "@core/use-cases/comment/create-comment/create-comment.usecase";
import type { DeleteCommentUseCase } from "@core/use-cases/comment/delete-comment/delete-comment.usecase";
import type { GetPostCommentsUseCase } from "@core/use-cases/comment/get-post-comments/get-post-comments.usecase";
import type { LikeCommentUseCase } from "@core/use-cases/comment/like-comment/like-comment.usecase";
import type { UnlikeCommentUseCase } from "@core/use-cases/comment/unlike-comment/unlike-comment.usecase";
import { CommentPrismaMapper } from "@infrastructure/persistence/mappers/comment-prisma.mapper";
import type {
    CreateCommentBody,
    CreateCommentParams,
} from "@typings/schemas/comment/create-comment.schema";
import type { DeleteCommentParams } from "@typings/schemas/comment/delete-comment.schema";
import type {
    GetPostCommentsQuery,
    GetPostCommentsParams,
} from "@typings/schemas/comment/get-post-comments.schema";
import type { CommentActionParams } from "@typings/schemas/comment/like-comment.schema";
import type { FastifyRequest, FastifyReply } from "fastify";

export class CommentController {
    /**
     * Creates a new CommentController instance
     * @param createCommentUseCase - Use case for creating comments
     */
    constructor(
        private readonly createCommentUseCase: CreateCommentUseCase,
        private readonly deleteCommentUseCase: DeleteCommentUseCase,
        private readonly getPostCommentsUseCase: GetPostCommentsUseCase,
        private readonly likeCommentUseCase: LikeCommentUseCase,
        private readonly unlikeCommentUseCase: UnlikeCommentUseCase,
    ) {}

    /**
     * Creates a new comment on a post
     * @param request - Fastify request containing comment data and post ID
     * @param reply - Fastify reply for sending response
     * @returns Promise that resolves when comment is created
     */
    async create(
        request: FastifyRequest<{
            Params: CreateCommentParams;
            Body: CreateCommentBody;
        }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;
        const postId = request.params.id;
        const { content, parentId } = request.body;

        const comment = await this.createCommentUseCase.execute({
            content,
            postId,
            authorId: userId,
            parentId,
        });

        return reply.status(201).send({
            data: {
                id: comment.id,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    async delete(
        request: FastifyRequest<{ Params: DeleteCommentParams }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { id: postId, commentId } = request.params;
        const userId = request.user.id;

        await this.deleteCommentUseCase.execute({
            commentId,
            postId,
            userId,
        });

        return reply.status(204).send();
    }

    async getPostComments(
        request: FastifyRequest<{
            Params: GetPostCommentsParams;
            Querystring: GetPostCommentsQuery;
        }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { id } = request.params;
        const { page = 1, limit = 10 } = request.query;

        const currentUserId = request.user?.id;

        const cdnUrl = request.server.config.R2_PUBLIC_URL;

        const comments = await this.getPostCommentsUseCase.execute({
            postId: id,
            page,
            limit,
            currentUserId,
        });

        const formattedData = CommentPrismaMapper.toListResponse(
            comments,
            cdnUrl,
        );

        return reply.status(200).send({
            data: formattedData,
            meta: {
                currentPage: page,
                limit,
            },
        });
    }

    async likeComment(
        request: FastifyRequest<{ Params: CommentActionParams }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { id } = request.params;
        const userId = request.user!.id;

        await this.likeCommentUseCase.execute({ commentId: id, userId });

        return reply.status(200).send({
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    async unlikeComment(
        request: FastifyRequest<{ Params: CommentActionParams }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { id } = request.params;
        const userId = request.user!.id;

        await this.unlikeCommentUseCase.execute({ commentId: id, userId });

        return reply.status(200).send({
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }
}
