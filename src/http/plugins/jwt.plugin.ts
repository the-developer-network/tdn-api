import fastifyPlugin from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { JwtService } from "@infrastructure/services/jwt.service";
import type { FastifyInstance } from "fastify";

function jwtPlugin(fastify: FastifyInstance): void {
    fastify.register(fastifyJwt, {
        secret: fastify.config.ACCESS_TOKEN_SECRET_KEY,
        sign: {
            expiresIn: fastify.config.ACCESS_TOKEN_EXPIRES_IN,
        },
    });

    const jwtService = new JwtService(fastify);
    fastify.decorate("jwtService", jwtService);
}

export default fastifyPlugin(jwtPlugin, {
    name: "jwt-plugin",
});
