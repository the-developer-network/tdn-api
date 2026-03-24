/**
 * Schema for bookmark retrieval query parameters
 */
import { Type, type Static } from "@sinclair/typebox";

/**
 * Schema for retrieving bookmarks
 * @description Validates pagination parameters for bookmark listing
 */
export const getBookmarksQuerySchema = Type.Object({
    /** Page number for pagination (minimum: 1, default: 1) */
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    /** Number of bookmarks per page (minimum: 1, maximum: 100, default: 10) */
    limit: Type.Optional(
        Type.Number({ minimum: 1, maximum: 100, default: 10 }),
    ),
});

/**
 * Type for bookmark retrieval query parameters
 */
export type GetBookmarksQuery = Static<typeof getBookmarksQuerySchema>;
