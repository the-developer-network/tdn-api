import type { Notification } from "@core/domain/entities/notification.entity";

/**
 * Parameters for paginated notification retrieval.
 */
export interface FindNotificationsInput {
    userId: string;
    take: number;
    skip: number;
}

/**
 * Repository interface for managing Notification entities.
 * Following Clean Architecture principles, this interface defines the contract
 * for persisting and retrieving Notification domain entities without exposing
 * implementation details or DTOs.
 */
export interface INotificationRepository {
    /**
     * Creates a new notification entity in the persistence layer.
     * @param notification - The Notification entity to be created.
     */
    create(notification: Notification): Promise<void>;

    /**
     * Retrieves the count of unread notifications for a specific user.
     * @param userId - The unique identifier of the user.
     * @returns The number of unread notifications.
     */
    getUnreadCount(userId: string): Promise<number>;

    /**
     * Retrieves a paginated list of notifications for a specific user.
     * @param input - Pagination parameters including user ID, take, and skip.
     * @returns An array of Notification entities.
     */
    findAllByUserId(input: FindNotificationsInput): Promise<Notification[]>;

    /**
     * Retrieves the total count of notifications for a specific user.
     * @param userId - The unique identifier of the user.
     * @returns The total number of notifications.
     */
    countByUserId(userId: string): Promise<number>;

    /**
     * Marks all notifications for a specific user as read.
     * @param userId - The unique identifier of the user.
     */
    markAllAsRead(userId: string): Promise<void>;

    /**
     * Deletes expired notifications based on a cutoff date.
     * @param cutOffDate - The date before which notifications are considered expired.
     * @returns The number of deleted notifications.
     */
    deleteExpiredNotifications(cutOffDate: Date): Promise<number>;
}
