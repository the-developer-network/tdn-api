import { type Static, Type } from "@fastify/type-provider-typebox";
import { ResponseSchema } from "../create-response-schema";

export const ResetPasswordBodySchema = Type.Object({
    email: Type.String({ format: "email" }),
    otp: Type.String({ minLength: 8, maxLength: 8 }),
    newPassword: Type.String({ minLength: 8 }),
});

export type ResetPasswordBody = Static<typeof ResetPasswordBodySchema>;

export const ResetPasswordResponseSchema = ResponseSchema(
    Type.Object({
        reset: Type.Boolean(),
    }),
);

export type ResetPasswordResponse = Static<typeof ResetPasswordResponseSchema>;
