import { type Static, Type } from "@fastify/type-provider-typebox";

export const ForgotPasswordBodySchema = Type.Object({
    email: Type.String({ format: "email" }),
});

export type ForgotPasswordBody = Static<typeof ForgotPasswordBodySchema>;
