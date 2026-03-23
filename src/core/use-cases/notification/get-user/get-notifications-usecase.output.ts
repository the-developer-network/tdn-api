import type { Notification } from "@core/domain/entities/notification.entity";

export interface GetNotificationsOutput {
    notifications: Notification[];
    total: number;
    currentPage: number;
    totalPages: number;
}
