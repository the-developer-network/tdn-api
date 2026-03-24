/**
 * Schema for bookmark creation parameters
 */
import { Type, type Static } from "@sinclair/typebox";

/**
 * Schema for saving a bookmark
 * @description Validates the post ID parameter for bookmark creation
 */
export const saveBookmarkParamsSchema = Type.Object(
    {
        /** The ID of the post to bookmark (must be a valid UUID) */
        id: Type.String({
            format: "uuid",
        }),
    },
    { additionalProperties: false },
);

/**
 * Type for bookmark creation parameters
 */
export type SaveBookmarkParams = Static<typeof saveBookmarkParamsSchema>;
