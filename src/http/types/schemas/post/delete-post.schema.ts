import { type Static, Type } from "@fastify/type-provider-typebox";

export const deletePostParamsSchema = Type.Object({
    id: Type.String({
        format: "uuid",
        description: "The unique identifier of the post to delete",
    }),
});

export type DeletePostParams = Static<typeof deletePostParamsSchema>;
