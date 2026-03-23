import type { NotificationType } from "@core/domain/enums/notification-type.enum";

/**
 * Props interface for Notification entity
 */
export interface NotificationProps {
    recipientId: string;
    issuerId: string;
    type: NotificationType;
    referenceId?: string;
    username?: string;
    avatarUrl?: string;
    createdAt?: Date;
    isRead: boolean;
}

/**
 * Rich domain model for Notification entity
 * Encapsulates both data and business logic related to notifications
 */
export class Notification {
    constructor(private readonly props: NotificationProps) {}

    /**
     * Creates a new Notification entity with minimal required data.
     * @param recipientId - The ID of the user receiving the notification
     * @param issuerId - The ID of the user issuing the notification
     * @param type - The type of the notification
     * @param referenceId - Optional reference ID for the notification
     * @returns A new Notification entity
     */
    public static create(
        recipientId: string,
        issuerId: string,
        type: NotificationType,
        referenceId?: string,
    ): Notification {
        return new Notification({
            recipientId,
            issuerId,
            type,
            referenceId,
            username: undefined,
            avatarUrl: undefined,
            createdAt: undefined,
            isRead: false,
        });
    }

    /**
     * Get the ID of the user who received this notification
     */
    get recipientId(): string {
        return this.props.recipientId;
    }

    /**
     * Get the ID of the user who issued this notification
     */
    get issuerId(): string {
        return this.props.issuerId;
    }

    /**
     * Get the username of the notification issuer
     */
    get username(): string | undefined {
        return this.props.username;
    }

    /**
     * Get the type of the notification
     */
    get type(): NotificationType {
        return this.props.type;
    }

    /**
     * Get the avatar URL of the notification issuer
     */
    get avatarUrl(): string | undefined {
        return this.props.avatarUrl;
    }

    /**
     * Get the reference ID of the notification (optional)
     */
    get referenceId(): string | undefined {
        return this.props.referenceId;
    }

    /**
     * Get the creation date of the notification
     */
    get createdAt(): Date {
        return this.props.createdAt!;
    }

    /**
     * Check if the notification has been read
     */
    get isRead(): boolean {
        return this.props.isRead;
    }

    /**
     * Check if the notification is unread
     */
    public isUnread(): boolean {
        return !this.props.isRead;
    }

    /**
     * Mark the notification as read
     */
    public markAsRead(): void {
        this.props.isRead = true;
    }

    /**
     * Check if this notification is of a specific type
     */
    public isType(notificationType: string): boolean {
        return this.props.type === notificationType;
    }

    /**
     * Check if this is a follow notification
     */
    public isFollowNotification(): boolean {
        return this.isType("FOLLOW");
    }

    /**
     * Check if this is a new post notification
     */
    public isNewPostNotification(): boolean {
        return this.isType("NEW_POST");
    }

    /**
     * Get a human-readable description of the notification
     */
    public getDescription(): string {
        switch (this.props.type) {
            case "FOLLOW":
                return `${this.props.username} started following you`;
            case "NEW_POST":
                return `${this.props.username} posted a new update`;
            default:
                return `Notification from ${this.props.username}`;
        }
    }

    /**
     * Check if the notification was created within the last specified hours
     */
    public isRecent(hours: number): boolean {
        if (!this.props.createdAt) return false;
        const now = new Date();
        const timeDiff = now.getTime() - this.props.createdAt.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff <= hours;
    }
}
