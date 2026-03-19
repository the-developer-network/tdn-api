import type {
    RealtimePort,
    RealtimeNotificationPayload,
} from "@core/ports/services/realtime.port";
import type { WebSocketManager } from "@infrastructure/websocket/websocket-manager";

export class FastifyRealtimeService implements RealtimePort {
    constructor(private readonly wsManager: WebSocketManager) {}

    emitToUser(
        userId: string,
        event: string,
        payload: RealtimeNotificationPayload,
    ): void {
        const socket = this.wsManager.getClient(userId);

        if (socket && socket.readyState === 1) {
            const message = JSON.stringify({ event, payload });
            socket.send(message);
        }
    }
}
