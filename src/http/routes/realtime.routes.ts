/**
 * @module RealtimeRoutes
 * Realtime routes including WebSocket connection with authentication.
 * @author TDN Team
 * @version 1.0.0
 */

import type { FastifyInstance, FastifyRequest } from "fastify";

/**
 * Sets up realtime routes on the Fastify instance
 *
 * @param fastify - The Fastify application instance
 * @returns void
 */
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
            const AUTH_TIMEOUT_MS = 10_000;
            let authenticated = false;

            const authTimeout = setTimeout(() => {
                if (!authenticated) {
                    fastify.log.warn(
                        { event: "ws_auth_timeout", ip: req.ip },
                        "WebSocket connection closed: auth message not received in time",
                    );
                    connection.close(
                        1008,
                        "Policy Violation: Authentication timeout",
                    );
                }
            }, AUTH_TIMEOUT_MS);

            connection.on("message", (raw: unknown) => {
                if (!authenticated) {
                    let parsed: { event?: string; token?: string };

                    try {
                        const text = Buffer.isBuffer(raw)
                            ? raw.toString("utf8")
                            : String(raw);
                        parsed = JSON.parse(text) as {
                            event?: string;
                            token?: string;
                        };
                    } catch {
                        fastify.log.warn(
                            { event: "ws_auth_malformed", ip: req.ip },
                            "WebSocket auth failed: malformed JSON",
                        );
                        connection.close(
                            1008,
                            "Policy Violation: Malformed auth message",
                        );
                        return;
                    }

                    if (parsed.event !== "auth" || !parsed.token) {
                        fastify.log.warn(
                            { event: "ws_auth_invalid_event", ip: req.ip },
                            "WebSocket auth failed: expected { event: 'auth', token }",
                        );
                        connection.close(
                            1008,
                            "Policy Violation: Invalid auth message",
                        );
                        return;
                    }

                    let userId: string;

                    try {
                        const decoded = fastify.jwt.verify<{ id: string }>(
                            parsed.token,
                        );
                        userId = decoded.id;
                    } catch {
                        fastify.log.warn(
                            {
                                event: "ws_auth_rejected",
                                ip: req.ip,
                                reason: "Invalid or expired token",
                            },
                            "WebSocket auth rejected: invalid token",
                        );
                        connection.close(
                            1008,
                            "Policy Violation: Invalid token",
                        );
                        return;
                    }

                    clearTimeout(authTimeout);
                    authenticated = true;

                    wsManager.addClient(userId, connection);

                    connection.send(JSON.stringify({ event: "auth_success" }));

                    fastify.log.info(
                        { event: "ws_client_connected", userId, ip: req.ip },
                        "WebSocket client authenticated and connected",
                    );

                    connection.on("close", (code: number, reason: Buffer) => {
                        fastify.log.info(
                            {
                                event: "ws_client_disconnected",
                                userId,
                                code,
                                reason:
                                    reason.toString() || "No reason provided",
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
                            },
                            "WebSocket connection encountered an error",
                        );
                    });

                    return;
                }

                fastify.log.debug(
                    {
                        event: "ws_message_received",
                        messageSize: Buffer.isBuffer(raw)
                            ? raw.length
                            : String(raw).length,
                    },
                    "WebSocket message received",
                );
            });
        },
    );
}
