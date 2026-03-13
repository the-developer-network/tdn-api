import { type Static, Type } from "@fastify/type-provider-typebox";
import { ResponseSchema } from "../create-response-schema";

export const VerifyEmailBodySchema = Type.Object({
    otp: Type.String({ minLength: 8, maxLength: 8, pattern: "^[0-9]+$" }),
});

export type VerifyEmailBody = Static<typeof VerifyEmailBodySchema>;

export const VerifyEmailResponseSchema = ResponseSchema(
    Type.Object({
        verified: Type.Boolean(),
    }),
);

export type VerifyEmailResponse = Static<typeof VerifyEmailResponseSchema>;
