import type { INotificationRepository } from "@core/ports/repositories/notification.repository";

export class MarkAllNotificationsAsReadUseCase {
    constructor(
        private readonly notificationRepository: INotificationRepository,
    ) {}

    async execute(userId: string): Promise<void> {
        await this.notificationRepository.markAllAsRead(userId);
    }
}
