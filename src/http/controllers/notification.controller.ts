import type { FastifyReply, FastifyRequest } from "fastify";
import type { GetUserNotificatonUseCase } from "@core/use-cases/notification/get-user-notification.usecase";
import type { GetNotificationsQuery } from "@typings/schemas/notification/get-notification.schema";
import type { MarkAllNotificationsAsReadUseCase } from "@core/use-cases/notification/mark-all-notifications-as-read.usecase";

export default class NotificationController {
    constructor(
        private readonly getUserNotificationsUseCase: GetUserNotificatonUseCase,
        private readonly markAllReadUseCase: MarkAllNotificationsAsReadUseCase,
    ) {}

    async getNotifications(
        request: FastifyRequest<{
            Querystring: GetNotificationsQuery;
        }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { page = 1, limit = 10 } = request.query;
        const userId = request.user.id;

        const response = await this.getUserNotificationsUseCase.execute({
            userId,
            page,
            limit,
        });

        return reply.status(200).send({
            success: true,
            data: response.notifications,
            meta: {
                total: response.total,
                currentPage: response.currentPage,
                totalPages: response.totalPages,
            },
        });
    }

    async markAllAsRead(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;

        await this.markAllReadUseCase.execute(userId);

        return reply.status(200).send({
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }
}
