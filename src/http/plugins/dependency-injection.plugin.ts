import { diContainer, fastifyAwilixPlugin } from "@fastify/awilix";
import { asValue, InjectionMode } from "awilix";
import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

import {
    persistenceModule,
    securityModule,
    externalModule,
    realtimeModule,
    useCasesModule,
    jobsModule,
    controllersModule,
} from "./di";

function dependencyInjectionPlugin(fastify: FastifyInstance): void {
    fastify.register(fastifyAwilixPlugin, {
        disposeOnClose: true,
        disposeOnResponse: false,
    });

    diContainer.options.injectionMode = InjectionMode.CLASSIC;

    diContainer.register({
        prisma: asValue(fastify.prisma),
        logger: asValue(fastify.log),
        config: asValue(fastify.config),
        jwt: asValue(fastify.jwt),
        fastify: asValue(fastify),

        ...persistenceModule,
        ...securityModule,
        ...externalModule,
        ...realtimeModule,
        ...useCasesModule,
        ...jobsModule,
        ...controllersModule,
    });
}

export default fastifyPlugin(dependencyInjectionPlugin, {
    name: "di-plugin",
    dependencies: ["prisma-plugin", "env-plugin"],
});
