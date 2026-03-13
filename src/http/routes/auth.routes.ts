import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    ForgotPasswordBodySchema,
    type ForgotPasswordBody,
} from "@typings/schemas/auth/forgot-password.schema";
import {
    LoginBodySchema,
    LoginResponseSchema,
    type LoginBody,
    type LoginResponse,
} from "@typings/schemas/auth/login.schema";
import {
    RecoverAccountSchema,
    type RecoverAccountBody,
} from "@typings/schemas/auth/recover-account.schema";
import {
    RegisterBodySchema,
    RegisterResponseSchema,
    type RegisterBody,
    type RegisterResponse,
} from "@typings/schemas/auth/register.schema";
import {
    ResetPasswordBodySchema,
    ResetPasswordResponseSchema,
    type ResetPasswordBody,
    type ResetPasswordResponse,
} from "@typings/schemas/auth/reset-password.schema";
import {
    SendVerificationResponseSchema,
    type SendVerificationResponse,
} from "@typings/schemas/auth/send-verification.schema";
import {
    VerifyEmailBodySchema,
    VerifyEmailResponseSchema,
    type VerifyEmailBody,
    type VerifyEmailResponse,
} from "@typings/schemas/auth/verify-email.schema";
import type { FastifyInstance } from "fastify";

export function authRoutes(fastify: FastifyInstance): void {
    const authController = fastify.diContainer.cradle.authController;

    fastify.post<{ Body: RegisterBody; Reply: { 201: RegisterResponse } }>(
        "/register",
        {
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: {
                body: RegisterBodySchema,
                response: { 201: RegisterResponseSchema },
            },
        },
        authController.register.bind(authController),
    );

    fastify.post<{ Body: LoginBody; Reply: { 200: LoginResponse } }>(
        "/login",
        {
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: {
                body: LoginBodySchema,
                response: { 200: LoginResponseSchema },
            },
        },
        authController.login.bind(authController),
    );

    fastify.post<{ Reply: { 200: LoginResponse } }>(
        "/refresh",
        {
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
            schema: {
                response: { 200: LoginResponseSchema },
            },
        },
        authController.refresh.bind(authController),
    );

    fastify.post<{ Reply: { 204: void } }>(
        "/logout",
        {
            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        authController.logout.bind(authController),
    );

    fastify.post<{ Reply: { 200: SendVerificationResponse } }>(
        "/send-verification",
        {
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: {
                response: { 200: SendVerificationResponseSchema },
            },
        },
        authController.sendVerification.bind(authController),
    );

    fastify.post<{
        Body: VerifyEmailBody;
        Reply: { 200: VerifyEmailResponse };
    }>(
        "/verify-email",
        {
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: {
                body: VerifyEmailBodySchema,
                response: { 200: VerifyEmailResponseSchema },
            },
        },

        authController.verifyEmail.bind(authController),
    );

    fastify.post<{ Body: ForgotPasswordBody; Reply: { 204: void } }>(
        "/forgot-password",
        {
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: { body: ForgotPasswordBodySchema },
        },
        authController.forgotPassword.bind(authController),
    );

    fastify.post<{
        Body: ResetPasswordBody;
        Reply: { 200: ResetPasswordResponse };
    }>(
        "/reset-password",
        {
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: {
                body: ResetPasswordBodySchema,
                response: { 200: ResetPasswordResponseSchema },
            },
        },
        authController.resetPassword.bind(authController),
    );

    fastify.post<{ Body: RecoverAccountBody; Reply: LoginResponse }>(
        "/recover-account",
        {
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: {
                body: RecoverAccountSchema,
            },
        },
        authController.recoverAccount,
    );
}

export default authRoutes;
