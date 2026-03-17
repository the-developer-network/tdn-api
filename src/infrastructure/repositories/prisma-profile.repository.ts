import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";

export class PrismaProfileRepository implements IProfileRepository {
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    async updateAvatar(
        userId: string,
        avatarUrl: string | null,
    ): Promise<void> {
        await this.prisma.profile.update({
            where: { userId },
            data: { avatarUrl },
        });
    }

    async findAvatarByUserId(userId: string): Promise<string | null> {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            select: { avatarUrl: true },
        });

        return profile?.avatarUrl ?? null;
    }
}
