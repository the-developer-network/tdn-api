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
        const prismaType = data.type;

        await this.prisma.notification.create({
            data: {
                recipientId: data.recipientId,
                issuerId: data.issuerId,
                type: prismaType,
                referenceId: data.referenceId,
            },
        });
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
}
