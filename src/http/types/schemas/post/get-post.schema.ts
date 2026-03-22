import { Type, type Static } from "@sinclair/typebox";
import { PostType } from "@core/ports/repositories/post.repository";

export const getPostsQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ default: 1, minimum: 1 })),
    limit: Type.Optional(
        Type.Number({
            default: 10,
            minimum: 1,
            maximum: 50,
        }),
    ),
    type: Type.Optional(Type.Enum(PostType, {})),
});

export type GetPostsQuery = Static<typeof getPostsQuerySchema>;
