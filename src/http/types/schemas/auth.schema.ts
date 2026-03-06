import { type Static, type TSchema, Type } from "@sinclair/typebox";

export const RegisterBodySchema = Type.Object({
    email: Type.String({ format: "email" }),
    username: Type.String({ minLength: 3, maxLength: 32 }),
    password: Type.String({ minLength: 8 }),
});

export type RegisterBody = Static<typeof RegisterBodySchema>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createResponseSchema = <T extends TSchema>(schema: T) => {
    return Type.Object({
        data: schema,
        meta: Type.Object({
            timestamp: Type.String({ format: "date-time" }),
        }),
    });
};

export const RegisterResponseDataSchema = Type.Object({
    id: Type.String({ format: "uuid" }),
    username: Type.String(),
    createdAt: Type.String({ format: "date-time" }),
});

export type RegisterResponseData = Static<typeof RegisterResponseDataSchema>;

export const RegisterResponseSchema = createResponseSchema(
    RegisterResponseDataSchema,
);

export const LoginBodySchema = Type.Object({
    identifier: Type.String(),
    password: Type.String(),
});

export type LoginBody = Static<typeof LoginBodySchema>;

export const LoginResponseSchema = Type.Object({
    accessToken: Type.String(),
    expiresAt: Type.Number(),
    user: Type.Object({
        id: Type.String({ format: "uuid " }),
        username: Type.String(),
    }),
});

export type LoginResponse = Static<typeof LoginResponseSchema>;

export const LoginResponseDataSchema =
    createResponseSchema(LoginResponseSchema);
