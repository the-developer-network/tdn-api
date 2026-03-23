import type { IFollowRepository } from "@core/ports/repositories/follow.repository";

export interface FollowListItem {
    userId: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    bio: string | null;
    isFollowing: boolean;
    isMe: boolean;
}

export class GetFollowersUseCase {
    constructor(private readonly followUserRepository: IFollowRepository) {}

    async execute(
        targetId: string,
        currentUserId: string | undefined,
        limit: number,
        offset: number,
    ): Promise<FollowListItem[]> {
        const followers = await this.followUserRepository.getFollowers(
            targetId,
            limit,
            offset,
        );

        if (followers.length === 0) return [];

        let followedIds = new Set<string>();

        if (currentUserId) {
            const listedUserIds = followers.map((f) => f.userId);
            const followedArray =
                await this.followUserRepository.checkIsFollowingBulk(
                    currentUserId,
                    listedUserIds,
                );

            followedIds = new Set(followedArray);
        }

        return followers.map((f) => ({
            ...f,
            isFollowing: currentUserId ? followedIds.has(f.userId) : false,
            isMe: currentUserId === f.userId,
        }));
    }
}
