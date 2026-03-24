/**
 * Prisma implementation of the bookmark repository
 */
import type { IBookmarkRepository } from "@core/ports/repositories/bookmark.repository";
import type { PrismaTransactionalClient } from "@infrastructure/persistence/database/prisma-client.type";

export class PrismaBookmarkRepository implements IBookmarkRepository {
    /**
     * Creates a new PrismaBookmarkRepository instance
     * @param prisma - Prisma client for database operations
     */
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    /**
     * Saves a bookmark for a post by a user
     * @param postId - The ID of the post to bookmark
     * @param userId - The ID of the user creating the bookmark
     * @returns Promise that resolves when the bookmark is saved
     */
    async save(postId: string, userId: string): Promise<void> {
        await this.prisma.postBookmark.create({
            data: { postId, userId },
        });
    }

    /**
     * Removes a bookmark for a post by a user
     * @param postId - The ID of the post to unbookmark
     * @param userId - The ID of the user removing the bookmark
     * @returns Promise that resolves when the bookmark is removed
     */
    async remove(postId: string, userId: string): Promise<void> {
        await this.prisma.postBookmark.delete({
            where: { postId_userId: { postId, userId } },
        });
    }

    /**
     * Checks if a post is bookmarked by a user
     * @param postId - The ID of the post to check
     * @param userId - The ID of the user to check for
     * @returns Promise that resolves to true if bookmarked, false otherwise
     */
    async isBookmarked(postId: string, userId: string): Promise<boolean> {
        const bookmark = await this.prisma.postBookmark.findUnique({
            where: { postId_userId: { postId, userId } },
        });
        return !!bookmark;
    }
}
