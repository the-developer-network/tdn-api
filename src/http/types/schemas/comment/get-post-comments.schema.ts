import { Type, type Static } from "@sinclair/typebox";

export const getPostCommentsParamsSchema = Type.Object({
    id: Type.String({ format: "uuid", description: "Post ID" }),
});

export const getPostCommentsQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 })),
});

export type GetPostCommentsParams = Static<typeof getPostCommentsParamsSchema>;
export type GetPostCommentsQuery = Static<typeof getPostCommentsQuerySchema>;
