import { Type, type Static } from "@sinclair/typebox";

export const getCommentParamsSchema = Type.Object({
    commentId: Type.String({ format: "uuid", description: "Comment ID" }),
});

export type GetCommentParams = Static<typeof getCommentParamsSchema>;
