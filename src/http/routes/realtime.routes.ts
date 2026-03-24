import type { FastifyInstance, FastifyRequest } from "fastify";

export default function realtimeRoutes(fastify: FastifyInstance): void {
    const wsManager = fastify.diContainer.cradle.wsManager;

    fastify.get(
        "/ws",
        {
            websocket: true,
            schema: {
                tags: ["Realtime"],
            },
        },
        (connection, req: FastifyRequest) => {
            const query = req.query as { token?: string };
            const token = query.token;

            if (!token) {
                fastify.log.warn(
                    {
                        event: "ws_connection_rejected",
                        ip: req.ip,
                        reason: "Missing token",
                    },
                    "WebSocket connection rejected: No token provided",
                );
                connection.close(1008, "Policy Violation: Token is required");
                return;
            }

            let userId: string;

            try {
                const decoded = fastify.jwt.verify<{ id: string }>(token);
                userId = decoded.id;
            } catch {
                fastify.log.warn(
                    {
                        event: "ws_connection_rejected",
                        ip: req.ip,
                        reason: "Invalid or expired token",
                    },
                    "WebSocket connection rejected: Invalid token",
                );
                connection.close(1008, "Policy Violation: Invalid token");
                return;
            }

            wsManager.addClient(userId, connection);

            fastify.log.info(
                { event: "ws_client_connected", userId, ip: req.ip },
                "WebSocket client connected securely",
            );

            connection.on("message", (message: unknown) => {
                fastify.log.debug(
                    {
                        event: "ws_message_received",
                        userId,
                        messageSize: Buffer.isBuffer(message)
                            ? message.length
                            : String(message).length,
                    },
                    "WebSocket message received",
                );
            });

            connection.on("close", (code: number, reason: Buffer) => {
                fastify.log.info(
                    {
                        event: "ws_client_disconnected",
                        userId,
                        code,
                        reason: reason.toString() || "No reason provided",
                    },
                    "WebSocket client disconnected",
                );
            });

            connection.on("error", (error: Error) => {
                fastify.log.error(
                    {
                        event: "ws_client_error",
                        userId,
                        error: error.message,
                        stack: error.stack,
                    },
                    "WebSocket connection encountered an error",
                );
            });
        },
    );
}
