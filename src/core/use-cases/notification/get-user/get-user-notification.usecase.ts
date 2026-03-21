import type {
    GetNotificationOutput,
    INotificationRepository,
} from "@core/ports/repositories/notification.repository";

export interface GetNotificationsInput {
    userId: string;
    page: number;
    limit: number;
}

export interface GetNotificationsOutput {
    notifications: GetNotificationOutput[];
    total: number;
    currentPage: number;
    totalPages: number;
}

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
