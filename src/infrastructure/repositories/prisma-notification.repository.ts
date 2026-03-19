import type {
    INotificationRepository,
    CreateNotificationInput,
} from "@core/ports/repositories/notification.repository";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";

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
}
