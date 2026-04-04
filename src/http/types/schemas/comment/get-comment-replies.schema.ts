import { Type, type Static } from "@sinclair/typebox";

export const getCommentRepliesParamsSchema = Type.Object({
    commentId: Type.String({ format: "uuid", description: "Comment ID" }),
});

export const getCommentRepliesQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 })),
});

export type GetCommentRepliesParams = Static<
    typeof getCommentRepliesParamsSchema
>;
export type GetCommentRepliesQuery = Static<
    typeof getCommentRepliesQuerySchema
>;
