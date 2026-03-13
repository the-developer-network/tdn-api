import { type Static, Type } from "@fastify/type-provider-typebox";
import { ResponseSchema } from "../create-response-schema";

export const SendVerificationResponseSchema = ResponseSchema(
    Type.Object({
        sent: Type.Boolean(),
    }),
);

export type SendVerificationResponse = Static<
    typeof SendVerificationResponseSchema
>;
