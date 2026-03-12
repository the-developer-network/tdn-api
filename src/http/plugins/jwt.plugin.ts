import fastifyPlugin from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { AuthTokenService } from "@infrastructure/services/auth-token.service";
import type { FastifyInstance } from "fastify";

function jwtPlugin(fastify: FastifyInstance): void {
    fastify.register(fastifyJwt, {
        secret: fastify.config.ACCESS_TOKEN_SECRET_KEY,
        sign: {
            expiresIn: fastify.config.ACCESS_TOKEN_EXPIRES_IN,
        },
    });

    const authTokenService = new AuthTokenService(
        fastify.jwt,
        fastify.config.ACCESS_TOKEN_EXPIRES_IN,
        fastify.config.REFRESH_TOKEN_EXPIRES_IN,
    );

    fastify.decorate("jwtService", authTokenService);
}

export default fastifyPlugin(jwtPlugin, {
    name: "jwt-plugin",
});
