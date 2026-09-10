import { type Static, Type } from "@fastify/type-provider-typebox";
import { NativeSessionFields } from "../auth/client.schema";
import { ResponseSchema } from "../create-response-schema";

export const OAuthExchangeBodySchema = Type.Object({
    code: Type.String({ minLength: 1 }),
});

export type OAuthExchangeBody = Static<typeof OAuthExchangeBodySchema>;

export const OAuthExchangeResponseSchema = ResponseSchema(
    Type.Object({
        accessToken: Type.String(),
        expiresAt: Type.Number(),
        // Declared or the serializer strips them: the controller does put a
        // native flow's refresh token here, and without these fields a phone
        // signed in through OAuth got fifteen minutes and no way to renew.
        ...NativeSessionFields,
        user: Type.Object({
            id: Type.String({ format: "uuid" }),
            username: Type.String(),
            isEmailVerified: Type.Boolean(),
        }),
    }),
);

export type OAuthExchangeResponse = Static<typeof OAuthExchangeResponseSchema>;
