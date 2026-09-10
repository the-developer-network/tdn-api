import { type Static, Type } from "@fastify/type-provider-typebox";
import { ClientKindSchema } from "./client.schema";
import { LoginResponseSchema } from "./login.schema";

export const RecoverAccountSchema = Type.Object({
    recoveryToken: Type.String(),
    client: ClientKindSchema,
});
export type RecoverAccountBody = Static<typeof RecoverAccountSchema>;

export const RecoverAccountResponseSchema = LoginResponseSchema;
export type RecoverAccountResponse = Static<typeof LoginResponseSchema>;
