import type { FastifyReply, FastifyRequest } from "fastify";
import type { GetUserNotificationUseCase } from "@core/use-cases/notification/get-user";
import type { GetNotificationsQuery } from "@typings/schemas/notification/get-notification.schema";
import type { MarkAllNotificationsAsReadUseCase } from "@core/use-cases/notification/mark-all";
import { NotificationPrismaMapper } from "@infrastructure/persistence/mappers/notification-prisma.mapper";

export class NotificationController {
    constructor(
        private readonly getUserNotificationsUseCase: GetUserNotificationUseCase,
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

        const totalPages = Math.ceil(response.total / limit);

        const cdnUrl = request.server.config.R2_PUBLIC_URL;

        return reply.status(200).send({
            data: response.notifications.map((n) =>
                NotificationPrismaMapper.toResponse(n, cdnUrl),
            ),
            meta: {
                total: response.total,
                currentPage: page,
                totalPages,
                limit,
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
