import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import type { UpdateProfileInput } from "@core/use-cases/profile/update-profil/update-profile-usecase.input";
import type {
    Profile as PrismaProfile,
    Prisma,
} from "@generated/prisma/client";
import type { Profile } from "@core/entities/profile.entitiy";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";
import ProfilePrismaMapper from "@infrastructure/mappers/profile-prisma.mapper";

export class PrismaProfileRepository implements IProfileRepository {
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    async findByUserId(userId: string): Promise<Profile | null> {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });

        if (!profile) return null;

        return ProfilePrismaMapper.toDomain(profile as PrismaProfile);
    }

    async update(userId: string, data: UpdateProfileInput): Promise<void> {
        await this.prisma.profile.updateMany({
            where: { userId },
            data: {
                fullName: data.fullName,
                bio: data.bio,
                location: data.location,
                socials: data.socials as Prisma.InputJsonValue,
            },
        });
    }

    async updateAvatar(
        userId: string,
        avatarUrl: string | null,
    ): Promise<void> {
        await this.prisma.profile.update({
            where: { userId },
            data: {
                avatarUrl: avatarUrl ?? undefined,
            },
        });
    }

    async findAvatarByUserId(userId: string): Promise<string | null> {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            select: { avatarUrl: true },
        });

        return profile?.avatarUrl ?? null;
    }

    async updateBanner(userId: string, bannerUrl: string): Promise<void> {
        await this.prisma.profile.update({
            where: { userId },
            data: {
                bannerUrl,
            },
        });
    }
    async findBannerByUserId(userId: string): Promise<string | null> {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            select: { bannerUrl: true },
        });

        return profile?.bannerUrl ?? null;
    }
}
