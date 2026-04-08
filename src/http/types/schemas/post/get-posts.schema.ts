import { Type, type Static } from "@sinclair/typebox";
import {
    Type as FBType,
    type Static as FBStatic,
} from "@fastify/type-provider-typebox";
import { PostType } from "@core/domain/enums/post-type.enum";
import { PostItemSchema } from "./get-post.schema";

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
    tag: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
    followedOnly: Type.Optional(Type.Boolean()),
});

export type GetPostsQuery = Static<typeof getPostsQuerySchema>;

export const GetFeedResponseSchema = FBType.Object({
    data: FBType.Array(PostItemSchema),
    meta: FBType.Object({
        total: FBType.Number(),
        currentPage: FBType.Number(),
        limit: FBType.Number(),
        totalPages: FBType.Number(),
    }),
});
export type GetFeedResponse = FBStatic<typeof GetFeedResponseSchema>;
