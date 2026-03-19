import type { WebSocket } from "@fastify/websocket";

export class WebSocketManager {
    private clients: Map<string, WebSocket> = new Map();

    addClient(userId: string, socket: WebSocket): void {
        this.clients.set(userId, socket);

        socket.on("close", () => {
            this.removeClient(userId);
        });
    }

    removeClient(userId: string): void {
        this.clients.delete(userId);
    }

    getClient(userId: string): WebSocket | undefined {
        return this.clients.get(userId);
    }
}
