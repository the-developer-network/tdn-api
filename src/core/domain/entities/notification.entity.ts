import type { NotificationType } from "../enums";
import type { NotificationProps } from "../interfaces/notification-props.interface";

/**
 * Rich domain model for Notification entity
 *
 * Encapsulates both data and business logic related to notifications.
 * Notifications are used to inform users about various activities and events
 * within the application such as follows, likes, comments, etc.
 *
 * This entity follows domain-driven design principles by encapsulating
 * business logic and validation within the entity itself.
 */
export class Notification {
    private constructor(private readonly props: NotificationProps) {}

    /**
     * Creates a new Notification entity with minimal required data.
     *
     * Factory method that ensures all required properties are provided
     * while setting sensible defaults for optional properties.
     *
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

    public static with(props: NotificationProps): Notification {
        return new Notification(props);
    }

    /**
     * Get the ID of the user who received this notification
     * @returns The recipient user ID
     */
    get recipientId(): string {
        return this.props.recipientId;
    }

    /**
     * Get the ID of the user who issued this notification
     * @returns The issuer user ID
     */
    get issuerId(): string {
        return this.props.issuerId;
    }

    /**
     * Get the username of the notification issuer
     * @returns The username or undefined if not provided
     */
    get username(): string | undefined {
        return this.props.username;
    }

    /**
     * Get the type of the notification
     * @returns The notification type enum value
     */
    get type(): NotificationType {
        return this.props.type;
    }

    /**
     * Get the avatar URL of the notification issuer
     * @returns The avatar URL or undefined if not provided
     */
    get avatarUrl(): string | undefined {
        return this.props.avatarUrl;
    }

    /**
     * Get the reference ID of the notification (optional)
     * @returns The reference ID or undefined if not provided
     */
    get referenceId(): string | undefined {
        return this.props.referenceId;
    }

    /**
     * Get the creation date of the notification
     * @returns The creation timestamp
     */
    get createdAt(): Date {
        return this.props.createdAt!;
    }

    /**
     * Check if the notification has been read
     * @returns True if the notification is marked as read, false otherwise
     */
    get isRead(): boolean {
        return this.props.isRead;
    }

    /**
     * Check if the notification is unread
     * @returns True if the notification is unread, false if read
     */
    public isUnread(): boolean {
        return !this.props.isRead;
    }

    /**
     * Mark the notification as read
     * This method mutates the entity state to mark it as read
     */
    public markAsRead(): void {
        this.props.isRead = true;
    }

    /**
     * Check if this notification is of a specific type
     * @param notificationType - The notification type to check against
     * @returns True if the notification matches the specified type
     */
    public isType(notificationType: string): boolean {
        return this.props.type === notificationType;
    }

    /**
     * Check if this is a follow notification
     * @returns True if this notification is of type FOLLOW
     */
    public isFollowNotification(): boolean {
        return this.isType("FOLLOW");
    }

    /**
     * Check if this is a new post notification
     * @returns True if this notification is of type NEW_POST
     */
    public isNewPostNotification(): boolean {
        return this.isType("NEW_POST");
    }

    /**
     * Get a human-readable description of the notification
     * @returns A descriptive string about what the notification represents
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
     * @param hours - The number of hours to check against
     * @returns True if the notification was created within the specified time frame
     */
    public isRecent(hours: number): boolean {
        if (!this.props.createdAt) return false;
        const now = new Date();
        const timeDiff = now.getTime() - this.props.createdAt.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff <= hours;
    }
}
