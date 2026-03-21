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

export interface FindNotificationsInput {
    userId: string;
    take: number;
    skip: number;
}

export interface GetNotificationOutput {
    recipientId: string;
    username: string;
    type: NotificationType;
    avatar_url: string;
    createdAt: Date;
    isRead: boolean;
}

export interface INotificationRepository {
    create(data: CreateNotificationInput): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
    findAllByUserId(
        input: FindNotificationsInput,
    ): Promise<GetNotificationOutput[]>;
    countByUserId(userId: string): Promise<number>;
    markAllAsRead(userId: string): Promise<void>;
    deleteExpiredNotifications(cutOffDate: Date): Promise<number>;
}
