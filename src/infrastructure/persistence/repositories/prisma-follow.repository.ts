import type { PrismaClient } from "@generated/prisma/client";
import type { IFollowRepository } from "@core/ports/repositories/follow.repository";

export class PrismaFollowUserRepository implements IFollowRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async checkIsFollowing(
        followerId: string,
        followingId: string,
    ): Promise<boolean> {
        const follow = await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        return follow !== null;
    }

    async followUser(followerId: string, followingId: string): Promise<void> {
        await this.prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        });
    }

    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        await this.prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
    }

    async getFollowers(
        targetId: string,
        limit: number,
        offset: number,
    ): Promise<
        {
            userId: string;
            username: string;
            fullName: string;
            avatarUrl: string;
            bio: string | null;
        }[]
    > {
        const follows = await this.prisma.follow.findMany({
            where: { followingId: targetId },
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
            select: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: {
                                fullName: true,
                                avatarUrl: true,
                                bio: true,
                            },
                        },
                    },
                },
            },
        });

        return follows.map((f) => ({
            userId: f.follower.id,
            username: f.follower.username,
            fullName: f.follower.profile?.fullName || "",
            avatarUrl: f.follower.profile?.avatarUrl || "",
            bio: f.follower.profile?.bio || null,
        }));
    }

    async getFollowing(
        targetId: string,
        limit: number,
        offset: number,
    ): Promise<
        {
            userId: string;
            username: string;
            fullName: string;
            avatarUrl: string;
            bio: string | null;
        }[]
    > {
        const follows = await this.prisma.follow.findMany({
            where: { followerId: targetId },
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
            select: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: {
                                fullName: true,
                                avatarUrl: true,
                                bio: true,
                            },
                        },
                    },
                },
            },
        });

        return follows.map((f) => ({
            userId: f.following.id,
            username: f.following.username,
            fullName: f.following.profile?.fullName || "",
            avatarUrl: f.following.profile?.avatarUrl || "",
            bio: f.following.profile?.bio || null,
        }));
    }

    async checkIsFollowingBulk(
        followerId: string,
        followingIds: string[],
    ): Promise<string[]> {
        if (followingIds.length === 0) return [];

        const follows = await this.prisma.follow.findMany({
            where: {
                followerId: followerId,
                followingId: { in: followingIds },
            },
            select: { followingId: true },
        });

        return follows.map((f) => f.followingId);
    }

    async getFollowersCount(userId: string): Promise<number> {
        return this.prisma.follow.count({ where: { followingId: userId } });
    }

    async getFollowingIds(followerId: string): Promise<string[]> {
        const follows = await this.prisma.follow.findMany({
            where: { followerId },
            select: { followingId: true },
        });
        return follows.map((f) => f.followingId);
    }
}
