import { type FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyPlugin from "fastify-plugin";

async function swaggerPlugin(fastify: FastifyInstance): Promise<void> {
    await fastify.register(fastifySwagger, {
        openapi: {
            info: {
                title: "TDN API",
                description: "The Daily News API Documentation",
                version: "1.0.0",
            },
            servers: [
                {
                    url: "http://localhost:8080",
                    description: "Development server",
                },
            ],
            components: {
                securitySchemes: {
                    BearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
        },
    });

    await fastify.register(fastifySwaggerUi, {
        routePrefix: "/api/v1/docs",
        uiConfig: {
            docExpansion: "full",
            deepLinking: false,
        },
        staticCSP: true,
        transformSpecification: (swaggerObject) => {
            return {
                ...swaggerObject,
                persistAuthorization: true,
            };
        },
        transformSpecificationClone: true,
    });
}

export default fastifyPlugin(swaggerPlugin, {
    name: "swagger-plugin",
});
