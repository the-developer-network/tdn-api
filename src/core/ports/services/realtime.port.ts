export interface RealtimeNotificationPayload {
    type: string;
    issuerId: string;
    message?: string;
}

export interface RealtimePort {
    emitToUser(
        userId: string,
        event: string,
        payload: RealtimeNotificationPayload,
    ): void;
}
