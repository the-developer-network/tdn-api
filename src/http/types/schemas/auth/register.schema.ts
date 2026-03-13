import { type Static, Type } from "@fastify/type-provider-typebox";
import { ResponseSchema } from "../create-response-schema";

export const RegisterBodySchema = Type.Object({
    email: Type.String({ format: "email" }),
    username: Type.String({ minLength: 3, maxLength: 32 }),
    password: Type.String({ minLength: 8 }),
});

export type RegisterBody = Static<typeof RegisterBodySchema>;

export const RegisterResponseSchema = ResponseSchema(
    Type.Object({
        id: Type.String({ format: "uuid" }),
        username: Type.String(),
        createdAt: Type.String({ format: "date-time" }),
    }),
);

export type RegisterResponse = Static<typeof RegisterResponseSchema>;
