import type {
    INotificationRepository,
    CreateNotificationInput,
    GetNotificationOutput,
    FindNotificationsInput,
} from "@core/ports/repositories/notification.repository";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";
import { NotificationPrismaMapper } from "@infrastructure/mappers/notification-prisma.mapper";

export class PrismaNotificationRepository implements INotificationRepository {
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    async create(data: CreateNotificationInput): Promise<void> {
        const notificationLimit = 100;

        const prismaType = data.type;

        await this.prisma.notification.create({
            data: {
                recipientId: data.recipientId,
                issuerId: data.issuerId,
                type: prismaType,
                referenceId: data.referenceId,
            },
        });

        const cutoffNotification = await this.prisma.notification.findMany({
            where: { recipientId: data.recipientId },
            orderBy: { createdAt: "desc" },
            skip: notificationLimit,
            take: 1,
            select: { createdAt: true },
        });

        if (cutoffNotification.length > 0) {
            await this.prisma.notification.deleteMany({
                where: {
                    recipientId: data.recipientId,
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
    }: FindNotificationsInput): Promise<GetNotificationOutput[]> {
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

        return raws.map((raw) => NotificationPrismaMapper.toResponse(raw));
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
