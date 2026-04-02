/**
 * Prisma implementation of the comment repository
 * Handles database operations for comments and nested comment relationships
 */
import type { PrismaTransactionalClient } from "@infrastructure/persistence/database/prisma-client.type";
import type { ICommentRepository } from "@core/ports/repositories/comment.repository";
import type { Comment } from "@core/domain/entities/comment.entity";
import {
    CommentPrismaMapper,
    type CommentWithRelations,
} from "../mappers/comment-prisma.mapper";

export class PrismaCommentRepository implements ICommentRepository {
    /**
     * Creates a new PrismaCommentRepository instance
     * @param prisma - Prisma client for database operations
     */
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    /**
     * Creates a new comment in the database
     * @param comment - The comment entity to create
     * @returns Promise that resolves when the comment is created
     */
    async create(comment: Comment): Promise<Comment> {
        const createdRaw = await this.prisma.comment.create({
            data: {
                id: comment.id,
                content: comment.content,
                mediaUrls: comment.mediaUrls,
                postId: comment.postId,
                authorId: comment.authorId,
                parentId: comment.parentId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: { avatarUrl: true, fullName: true },
                        },
                    },
                },
                likes: false,
                _count: { select: { replies: true } },
            },
        });

        return CommentPrismaMapper.toDomainComment(
            createdRaw as unknown as CommentWithRelations,
        );
    }

    /**
     * Finds a comment by its unique identifier
     * @param id - The comment ID to search for
     * @returns Promise that resolves to the comment or null if not found
     */
    async findById(
        id: string,
        currentUserId?: string,
    ): Promise<Comment | null> {
        const raw = await this.prisma.comment.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { avatarUrl: true } },
                    },
                },
                likes: currentUserId
                    ? { where: { userId: currentUserId } }
                    : false,
                _count: { select: { replies: true } },
            },
        });

        if (!raw) return null;
        return CommentPrismaMapper.toDomainComment(
            raw as unknown as CommentWithRelations,
        );
    }

    /**
     * Retrieves top-level comments for a post (where parentId is null)
     * @param postId - The ID of the post to get comments for
     * @param limit - Maximum number of comments to return
     * @param offset - Number of comments to skip for pagination
     * @returns Promise that resolves to an array of top-level comments
     */
    async findTopLevelByPostId(
        postId: string,
        limit: number,
        offset: number,
        currentUserId?: string,
    ): Promise<Comment[]> {
        const rawComments = await this.prisma.comment.findMany({
            where: {
                postId: postId,
                parentId: null,
            },
            skip: offset,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        profile: { select: { avatarUrl: true } },
                    },
                },
                likes: currentUserId
                    ? { where: { userId: currentUserId } }
                    : false,
                _count: { select: { replies: true } },
            },
        });

        return rawComments.map((raw) =>
            CommentPrismaMapper.toDomainComment(
                raw as unknown as CommentWithRelations,
            ),
        );
    }

    /**
     * Retrieves replies for a specific parent comment
     * @param parentId - The ID of the parent comment
     * @param limit - Maximum number of replies to return
     * @param offset - Number of replies to skip for pagination
     * @returns Promise that resolves to an array of reply comments
     */
    async findRepliesByParentId(
        parentId: string,
        limit: number,
        offset: number,
    ): Promise<Comment[]> {
        const rawReplies = await this.prisma.comment.findMany({
            where: { parentId },
            orderBy: { createdAt: "asc" },
            take: limit,
            skip: offset,
        });

        return rawReplies.map((raw) =>
            CommentPrismaMapper.toDomainComment(
                raw as unknown as CommentWithRelations,
            ),
        );
    }

    /**
     * Deletes a comment from the database
     * @param id - The ID of the comment to delete
     * @returns Promise that resolves when the comment is deleted
     */
    async delete(id: string): Promise<void> {
        await this.prisma.comment.delete({ where: { id } });
    }
    /**
     * Counts the number of replies for a specific parent comment
     * @param parentId - The ID of the parent comment
     * @returns Promise that resolves to the number of replies
     */
    async countReplies(parentId: string): Promise<number> {
        return this.prisma.comment.count({
            where: { parentId },
        });
    }

    async hasUserLiked(commentId: string, userId: string): Promise<boolean> {
        const like = await this.prisma.commentLike.findUnique({
            where: { commentId_userId: { commentId, userId } },
        });
        return !!like;
    }

    async addLike(commentId: string, userId: string): Promise<void> {
        await this.prisma.commentLike.create({
            data: { commentId, userId },
        });
    }

    async removeLike(commentId: string, userId: string): Promise<void> {
        await this.prisma.commentLike.delete({
            where: { commentId_userId: { commentId, userId } },
        });
    }

    async incrementLikeCount(commentId: string): Promise<void> {
        await this.prisma.comment.update({
            where: { id: commentId },
            data: { likeCount: { increment: 1 } },
        });
    }

    async decrementLikeCount(commentId: string): Promise<void> {
        await this.prisma.comment.update({
            where: { id: commentId },
            data: { likeCount: { decrement: 1 } },
        });
    }
}
