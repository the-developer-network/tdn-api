import type { PrismaClient } from "@generated/prisma/client";
import type { IPostLikeRepository } from "@core/ports/repositories/post-like.repository";

/**
 * Prisma implementation of the PostLike repository
 *
 * Provides database operations for post like relationships using Prisma ORM.
 * Implements the IPostLikeRepository interface to ensure consistent
 * data access patterns across different persistence implementations.
 */
export class PrismaPostLikeRepository implements IPostLikeRepository {
    /**
     * Creates a new PrismaPostLikeRepository instance
     * @param prisma - The Prisma client instance
     */
    constructor(private readonly prisma: PrismaClient) {}

    /**
     * Creates a like relationship between a user and a post
     * @param postId - The unique identifier of the post
     * @param userId - The unique identifier of the user
     * @returns Promise<void>
     */
    async like(postId: string, userId: string): Promise<void> {
        await this.prisma.postLike.create({
            data: { postId, userId },
        });
    }

    /**
     * Checks if a user has already liked a specific post
     * @param postId - The unique identifier of the post
     * @param userId - The unique identifier of the user
     * @returns Promise<boolean> - True if the user has liked the post, false otherwise
     */
    async isLiked(postId: string, userId: string): Promise<boolean> {
        const like = await this.prisma.postLike.findUnique({
            where: {
                postId_userId: { postId, userId },
            },
        });

        return !!like;
    }

    /**
     * Removes a like relationship between a user and a post
     * @param postId - The unique identifier of the post
     * @param userId - The unique identifier of the user
     * @returns Promise<void>
     */
    async unlike(postId: string, userId: string): Promise<void> {
        await this.prisma.postLike.delete({
            where: {
                postId_userId: { postId, userId },
            },
        });
    }
}
