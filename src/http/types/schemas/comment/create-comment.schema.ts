import { Type, type Static } from "@sinclair/typebox";

export const createCommentParamsSchema = Type.Object({
    id: Type.String({ format: "uuid", description: "The ID of the Post" }),
});

export type CreateCommentParams = Static<typeof createCommentParamsSchema>;

export const createCommentBodySchema = Type.Object({
    content: Type.String({ minLength: 1, maxLength: 500 }),
    parentId: Type.Optional(Type.String({ format: "uuid" })),
});

export type CreateCommentBody = Static<typeof createCommentBodySchema>;
