import { UnauthorizedError } from "@core/errors/unauthorized.error";
import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
    RegisterBodySchema,
    RegisterResponseSchema,
    LoginBodySchema,
    LoginResponseSchema,
    type RegisterResponse,
    type LoginResponse,
} from "@typings/schemas/auth.schema";
import type { FastifyReply, FastifyRequest } from "fastify";

const authRoutes: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {
    fastify.post(
        "/register",
        {
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

            const responseData = {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt.toISOString(),
            };

            reply.status(201);
            return responseData as unknown as RegisterResponse;
        },
    );

    fastify.post(
        "/login",
        {
            schema: {
                body: LoginBodySchema,
                response: {
                    200: LoginResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const deviceIp = request.ip;
            const userAgent = request.headers["user-agent"] || "Unknown Device";

            const response = await fastify.authService.login({
                identifier: request.body.identifier,
                password: request.body.password,
                deviceIp,
                userAgent,
            });

            reply.setCookie("refreshToken", response.refreshToken, {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                expires: response.refreshTokenExpiresAt,
                signed: true,
            });

            const responseData = {
                accessToken: response.accessToken,
                expiresAt: response.expiresAt,
                user: response.user,
            };

            reply.status(200);
            return responseData as unknown as LoginResponse;
        },
    );

    fastify.post(
        "/refresh",
        {
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
                userAgent: request.headers["user-agent"] || "Unknown Device",
            });

            reply.setCookie("refreshToken", response.refreshToken, {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                expires: response.refreshTokenExpiresAt,
                signed: true,
            });

            return {
                accessToken: response.accessToken,
                expiresAt: response.expiresAt,
                user: response.user,
            } as unknown as LoginResponse;
        },
    );

    fastify.post(
        "/logout",
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

            reply.status(204).send();
        },
    );
    done();
};

export default authRoutes;
