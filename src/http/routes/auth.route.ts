import { UnauthorizedError } from "@core/errors/unauthorized.error";
import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import { RateLimitPolicies } from "../plugins/rate-limit.plugin";
import {
    RegisterBodySchema,
    RegisterResponseSchema,
    type RegisterBody,
    type RegisterResponse,
    LoginBodySchema,
    LoginResponseSchema,
    type LoginBody,
    type LoginResponse,
    VerifyEmailBodySchema,
    VerifyEmailResponseSchema,
    type VerifyEmailBody,
    type VerifyEmailResponse,
    SendVerificationResponseSchema,
    type SendVerificationResponse,
    ForgotPasswordBodySchema,
    type ForgotPasswordBody,
    ResetPasswordBodySchema,
    ResetPasswordResponseSchema,
    type ResetPasswordBody,
    type ResetPasswordResponse,
} from "@typings/schemas/auth.schema";
import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";

export function authRoutes(
    fastify: FastifyInstance,
): ReturnType<FastifyPluginCallbackTypebox> {
    fastify.post<{ Body: RegisterBody; Reply: { 201: RegisterResponse } }>(
        "/register",
        {
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: {
                body: RegisterBodySchema,
                response: { 201: RegisterResponseSchema },
            },
        },
        async (request, reply) => {
            const user = await fastify.authService.register({
                email: request.body.email,
                username: request.body.username,
                password: request.body.password,
            });

            return reply.status(201).send({
                data: {
                    id: user.id,
                    username: user.username,
                    createdAt: user.createdAt.toISOString(),
                },
                meta: { timestamp: new Date().toISOString() },
            });
        },
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
        async (request, reply) => {
            const response = await fastify.authService.login({
                identifier: request.body.identifier,
                password: request.body.password,
                deviceIp: request.ip,
                userAgent: request.headers["user-agent"] ?? "Unknown Device",
            });

            reply.setCookie("refreshToken", response.refreshToken, {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                expires: response.refreshTokenExpiresAt,
                signed: true,
            });

            return reply.status(200).send({
                data: {
                    accessToken: response.accessToken,
                    expiresAt: response.expiresAt,
                    user: response.user,
                },
                meta: { timestamp: new Date().toISOString() },
            });
        },
    );

    fastify.post<{ Reply: { 200: LoginResponse } }>(
        "/refresh",
        {
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
            schema: {
                response: { 200: LoginResponseSchema },
            },
        },
        async (request, reply) => {
            const rawCookie = request.cookies.refreshToken;

            if (!rawCookie) {
                throw new UnauthorizedError("Authentication session not found");
            }

            const unsignedCookie = request.unsignCookie(rawCookie);

            if (!unsignedCookie.valid || !unsignedCookie.value) {
                throw new UnauthorizedError("Invalid session signature");
            }

            const response = await fastify.authService.refresh({
                token: unsignedCookie.value,
                deviceIp: request.ip,
                userAgent: request.headers["user-agent"] ?? "Unknown Device",
            });

            reply.setCookie("refreshToken", response.refreshToken, {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                expires: response.refreshTokenExpiresAt,
                signed: true,
            });

            return reply.status(200).send({
                data: {
                    accessToken: response.accessToken,
                    expiresAt: response.expiresAt,
                    user: response.user,
                },
                meta: { timestamp: new Date().toISOString() },
            });
        },
    );

    fastify.post<{ Reply: { 204: void } }>(
        "/logout",
        {
            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const rawCookie = request.cookies.refreshToken;

            if (rawCookie) {
                const unsignedCookie = request.unsignCookie(rawCookie);

                if (unsignedCookie.valid && unsignedCookie.value) {
                    await fastify.authService.logout({
                        token: unsignedCookie.value,
                    });
                }
            }

            reply.clearCookie("refreshToken", {
                path: "/",
                httpOnly: true,
                secure: fastify.config.NODE_ENV === "production",
                sameSite: "strict",
                signed: true,
            });

            return reply.status(204).send();
        },
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
        async (request, reply) => {
            await fastify.authService.sendVerificationEmail({
                userId: request.user.id,
            });

            return reply.status(200).send({
                data: { sent: true },
                meta: { timestamp: new Date().toISOString() },
            });
        },
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
        async (request, reply) => {
            await fastify.authService.verifyEmail({
                userId: request.user.id,
                otp: request.body.otp,
            });

            return reply.status(200).send({
                data: { verified: true },
                meta: { timestamp: new Date().toISOString() },
            });
        },
    );

    fastify.post<{ Body: ForgotPasswordBody; Reply: { 204: void } }>(
        "/forgot-password",
        {
            config: { rateLimit: RateLimitPolicies.STRICT },
            schema: { body: ForgotPasswordBodySchema },
        },
        async (request, reply) => {
            await fastify.authService.forgotPassword({
                email: request.body.email,
            });

            return reply.status(204).send();
        },
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
        async (request, reply) => {
            await fastify.authService.resetPassword({
                email: request.body.email,
                otp: request.body.otp,
                newPassword: request.body.newPassword,
            });

            return reply.status(200).send({
                data: { reset: true },
                meta: { timestamp: new Date().toISOString() },
            });
        },
    );
}

export default authRoutes;
