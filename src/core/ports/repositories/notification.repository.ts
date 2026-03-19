export enum NotificationType {
    FOLLOW = "FOLLOW",
    NEW_POST = "NEW_POST",
}

export interface CreateNotificationInput {
    recipientId: string;
    issuerId: string;
    type: NotificationType;
    referenceId?: string;
}

export interface INotificationRepository {
    create(data: CreateNotificationInput): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
}
