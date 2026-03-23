import type {
    INotificationRepository,
    FindNotificationsInput,
} from "@core/ports/repositories/notification.repository";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";
import { Notification } from "@core/domain/entities/notification.entity";
import { NotificationPrismaMapper } from "@infrastructure/mappers/notification-prisma.mapper";

export class PrismaNotificationRepository implements INotificationRepository {
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    async create(notification: Notification): Promise<void> {
        const notificationLimit = 100;

        const prismaData = NotificationPrismaMapper.toPrisma(notification);

        await this.prisma.notification.create({
            data: prismaData,
        });

        const cutoffNotification = await this.prisma.notification.findMany({
            where: { recipientId: notification.recipientId },
            orderBy: { createdAt: "desc" },
            skip: notificationLimit,
            take: 1,
            select: { createdAt: true },
        });

        if (cutoffNotification.length > 0) {
            await this.prisma.notification.deleteMany({
                where: {
                    recipientId: notification.recipientId,
                    createdAt: { lte: cutoffNotification[0].createdAt },
                },
            });
        }
    }

    getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: {
                recipientId: userId,
                isRead: false,
            },
        });
    }

    async findAllByUserId({
        userId,
        take,
        skip,
    }: FindNotificationsInput): Promise<Notification[]> {
        const raws = await this.prisma.notification.findMany({
            where: { recipientId: userId },
            take,
            skip,
            orderBy: { createdAt: "desc" },
            include: {
                issuer: {
                    select: {
                        username: true,
                        profile: {
                            select: {
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });

        return raws.map((raw) => {
            const notificationData = NotificationPrismaMapper.toResponse(raw);
            return new Notification({
                recipientId: raw.recipientId,
                issuerId: raw.issuerId,
                type: notificationData.type,
                referenceId: raw.referenceId || undefined,
                username: notificationData.username,
                avatarUrl: notificationData.avatarUrl,
                createdAt: raw.createdAt,
                isRead: raw.isRead,
            });
        });
    }

    async countByUserId(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: {
                recipientId: userId,
            },
        });
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.prisma.notification.updateMany({
            where: {
                recipientId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    }

    async deleteExpiredNotifications(cutoffDate: Date): Promise<number> {
        const result = await this.prisma.notification.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
            },
        });
        return result.count;
    }
}
