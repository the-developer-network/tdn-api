import type { FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import {
    RegisterBodySchema,
    RegisterResponseSchema,
    LoginBodySchema,
    LoginResponseDataSchema,
    type LoginBody,
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
            const response = await fastify.authService.register(request.body);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            reply.status(201).send(response as any);
        },
    );

    fastify.post(
        "/login",
        {
            schema: {
                body: LoginBodySchema,
                response: {
                    201: LoginResponseDataSchema,
                },
            },
        },
        async (request, reply) => {
            const response = await fastify.authService.login(request.body);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            reply.status(201).send(response as any);
        },
    );

    done();
};

export default authRoutes;
