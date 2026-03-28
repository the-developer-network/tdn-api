import { Type, type Static } from "@sinclair/typebox";

export const commentActionParamsSchema = Type.Object({
    id: Type.String({ format: "uuid", description: "Comment ID" }),
});

export type CommentActionParams = Static<typeof commentActionParamsSchema>;
