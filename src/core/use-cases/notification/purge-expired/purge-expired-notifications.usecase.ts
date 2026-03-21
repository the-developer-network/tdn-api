import type { INotificationRepository } from "@core/ports/repositories/notification.repository";

export class PurgeExpiredNotificationsUseCase {
    constructor(
        private readonly notificationRepository: INotificationRepository,
    ) {}

    async execute(gracePeriodDays: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - gracePeriodDays);

        return this.notificationRepository.deleteExpiredNotifications(
            cutoffDate,
        );
    }
}
