import type {
    FastifyError,
    FastifyInstance,
    FastifyReply,
    FastifyRequest,
} from "fastify";
import fastifyPlugin from "fastify-plugin";

/**
 * Custom Error and Not Found Handler Plugin.
 * Implements RFC 7807 (Problem Details for HTTP APIs) for standardized error responses.
 */
function errorHandlerPlugin(
    fastify: FastifyInstance,
    _options: unknown,
    done: () => void,
): void {
    /**
     * Handles 404 Not Found errors for non-existent routes.
     */
    fastify.setNotFoundHandler(
        (request: FastifyRequest, reply: FastifyReply) => {
            const errorResponse = {
                type: "about:blank",
                title: "Not Found",
                status: 404,
                detail: `The requested path (${request.method}:${request.url}) was not found.`,
                instance: request.url,
            };

            void reply.status(404).send(errorResponse);
        },
    );

    /**
     * Global error handler for catching internal server errors and custom thrown exceptions.
     */
    fastify.setErrorHandler(
        (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
            const statusCode = error.statusCode || 500;

            // Log internal server errors (500+) for debugging
            if (statusCode >= 500) {
                fastify.log.error(error);
            }

            // Standard RFC 7807 Error Response
            const errorResponse = {
                type: "about:blank",
                title: error.name || "Internal Server Error",
                status: statusCode,
                detail: error.message || "An unexpected error occurred.",
                instance: request.url,
            };

            void reply.status(statusCode).send(errorResponse);
        },
    );

    done();
}

export default fastifyPlugin(errorHandlerPlugin, {
    name: "global-error-handler",
});
