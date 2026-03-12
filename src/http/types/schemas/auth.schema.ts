import { type Static, Type } from "@fastify/type-provider-typebox";
import { ResponseSchema } from "./create-response-schema";

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

export const LoginBodySchema = Type.Object({
    identifier: Type.String(),
    password: Type.String(),
});

export type LoginBody = Static<typeof LoginBodySchema>;

export const LoginResponseSchema = ResponseSchema(
    Type.Object({
        accessToken: Type.String(),
        expiresAt: Type.Number(),
        user: Type.Object({
            id: Type.String({ format: "uuid" }),
            username: Type.String(),
        }),
    }),
);

export type LoginResponse = Static<typeof LoginResponseSchema>;

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

export const SendVerificationResponseSchema = ResponseSchema(
    Type.Object({
        sent: Type.Boolean(),
    }),
);

export type SendVerificationResponse = Static<
    typeof SendVerificationResponseSchema
>;

export const ForgotPasswordBodySchema = Type.Object({
    email: Type.String({ format: "email" }),
});

export type ForgotPasswordBody = Static<typeof ForgotPasswordBodySchema>;

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

export const RecoverAccountSchema = Type.Object({
    recoveryToken: Type.String(),
});

export type RecoverAccountBody = Static<typeof RecoverAccountSchema>;
