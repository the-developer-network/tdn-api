import { type Static, Type } from "@fastify/type-provider-typebox";

export const RecoverAccountSchema = Type.Object({
    recoveryToken: Type.String(),
});

export type RecoverAccountBody = Static<typeof RecoverAccountSchema>;
