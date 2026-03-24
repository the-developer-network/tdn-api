/**
 * Controller for handling bookmark-related HTTP requests
 */
import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateBookmarkUseCase } from "@core/use-cases/bookmark/create-bookmark/create-bookmark.usecase";
import type { RemoveBookmarkUseCase } from "@core/use-cases/bookmark/remove-bookmark/remove-bookmark.usecase";
import type { SaveBookmarkParams } from "@typings/schemas/bookmark/save-bookmark-params.schema";
import type { DeleteBookmarkParams } from "@typings/schemas/bookmark/delete-bookmark.params.schema";
import type { GetBookmarksQuery } from "@typings/schemas/bookmark/get-bookmarks-query.schema";
import type { GetBookmarksUseCase } from "@core/use-cases/bookmark/get-bookmarks/get-bookmarks.usecase";

export class BookmarkController {
    /**
     * Creates a new BookmarkController instance
     * @param createBookmarkUseCase - Use case for creating bookmarks
     * @param removeBookmarkUseCase - Use case for removing bookmarks
     * @param getBookmarksUseCase - Use case for retrieving bookmarks
     */
    constructor(
        private readonly createBookmarkUseCase: CreateBookmarkUseCase,
        private readonly removeBookmarkUseCase: RemoveBookmarkUseCase,
        private readonly getBookmarksUseCase: GetBookmarksUseCase,
    ) {}

    /**
     * Creates a bookmark for a post
     * @param request - Fastify request containing post ID in params
     * @param reply - Fastify reply for sending response
     * @returns Promise that resolves when bookmark is created
     */
    async save(
        request: FastifyRequest<{ Params: SaveBookmarkParams }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;
        const postId = request.params.id;

        await this.createBookmarkUseCase.execute({ postId, userId });

        return reply.status(201).send({
            meta: { timestamp: new Date().toISOString() },
        });
    }

    /**
     * Removes a bookmark for a post
     * @param request - Fastify request containing post ID in params
     * @param reply - Fastify reply for sending response
     * @returns Promise that resolves when bookmark is removed
     */
    async unsave(
        request: FastifyRequest<{ Params: DeleteBookmarkParams }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;
        const postId = request.params.id;

        await this.removeBookmarkUseCase.execute({ postId, userId });

        return reply.status(200).send({
            meta: { timestamp: new Date().toISOString() },
        });
    }

    /**
     * Retrieves bookmarks for the authenticated user
     * @param request - Fastify request containing pagination query parameters
     * @param reply - Fastify reply for sending response
     * @returns Promise that resolves with bookmarked posts
     */
    async getBookmarks(
        request: FastifyRequest<{ Querystring: GetBookmarksQuery }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;
        const { page, limit } = request.query;

        const result = await this.getBookmarksUseCase.execute({
            userId,
            page: page ?? 1,
            limit: limit ?? 10,
        });

        return reply.status(200).send({
            data: result.posts,
            meta: {
                total: result.total,
                page: page ?? 1,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
