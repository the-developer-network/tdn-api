import type { GetNotificationOutput } from "@core/ports/repositories/notification.repository";

export interface GetNotificationsOutput {
    notifications: GetNotificationOutput[];
    total: number;
    currentPage: number;
    totalPages: number;
}
