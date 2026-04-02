import { Type, type Static } from "@sinclair/typebox";

export const createCommentParamsSchema = Type.Object({
    postId: Type.String({ format: "uuid", description: "The ID of the Post" }),
});

export type CreateCommentParams = Static<typeof createCommentParamsSchema>;

export const createCommentBodySchema = Type.Object({
    content: Type.String({ minLength: 1, maxLength: 500 }),
    parentId: Type.Optional(
        Type.String({
            format: "uuid",
            description: "Optional parent comment ID for replies",
        }),
    ),
    mediaUrls: Type.Optional(
        Type.Array(Type.String({ format: "uri" }), {
            description: "Optional array of media URLs for the comment",
            maxItems: 4,
        }),
    ),
});

export type CreateCommentBody = Static<typeof createCommentBodySchema>;
