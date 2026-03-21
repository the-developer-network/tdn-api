import type { PurgeExpiredNotificationsUseCase } from "@core/use-cases/notification/purge-expired/purge-expired-notifications.usecase";

export default class NotificationPurgeJob {
    constructor(
        private readonly purgeExpiredNotificationsUseCase: PurgeExpiredNotificationsUseCase,
    ) {}

    async run(gracePeriodDays: number): Promise<number> {
        return this.purgeExpiredNotificationsUseCase.execute(gracePeriodDays);
    }
}
