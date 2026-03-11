import fastifyPlugin from "fastify-plugin";
import fastifyCookiePlugin from "@fastify/cookie";
import type { FastifyInstance } from "fastify";

function cookiePlugin(fastify: FastifyInstance): void {
    fastify.register(fastifyCookiePlugin, {
        secret: fastify.config.COOKIE_SECRET,
    });
}

export default fastifyPlugin(cookiePlugin);
