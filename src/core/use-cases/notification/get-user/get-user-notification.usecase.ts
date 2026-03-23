import type { INotificationRepository } from "@core/ports/repositories/notification.repository";
import type { GetNotificationsInput } from "./get-notifications-usecase.input";
import type { GetNotificationsOutput } from "./get-notifications-usecase.output";

export class GetUserNotificatonUseCase {
    public constructor(
        private readonly notificationRepository: INotificationRepository,
    ) {}

    async execute(
        input: GetNotificationsInput,
    ): Promise<GetNotificationsOutput> {
        const { userId, page, limit } = input;

        const skip = (page - 1) * limit;
        const take = limit;

        const [notifications, total] = await Promise.all([
            this.notificationRepository.findAllByUserId({
                userId,
                take,
                skip,
            }),
            this.notificationRepository.countByUserId(userId),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            notifications,
            total,
            currentPage: page,
            totalPages,
        };
    }
}
