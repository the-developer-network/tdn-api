import fastifyPlugin from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { optionalAuthHook } from "../hooks/optional-auth.hook";

function optionalAuthenticationDecorator(fastify: FastifyInstance): void {
    fastify.decorate("optionalAuthenticate", optionalAuthHook);
}

export default fastifyPlugin(optionalAuthenticationDecorator, {
    name: "optional-authentication-decorator",
    dependencies: ["@fastify/jwt"],
});
