import { Type, type Static } from "@sinclair/typebox";

export const checkUserBodySchema = Type.Object({
    identifier: Type.String({ maxLength: 100 }),
});

export type CheckUserBody = Static<typeof checkUserBodySchema>;
