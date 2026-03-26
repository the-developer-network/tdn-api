import { Type, type Static } from "@sinclair/typebox";

export const getPostParamsSchema = Type.Object({
    id: Type.String({
        format: "uuid",
        description: "The unique identifier of the post",
    }),
});

export type GetPostParams = Static<typeof getPostParamsSchema>;
