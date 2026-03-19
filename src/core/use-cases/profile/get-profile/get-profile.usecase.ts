import NotFoundError from "@core/errors/not-found.error";
import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import type { Profile } from "@core/entities/profile.entitiy";

export interface GetProfileResult {
    profile: Profile;
    isMe: boolean;
    isFollowing: boolean;
}

export class GetProfileUseCase {
    constructor(private readonly profileRepository: IProfileRepository) {}

    async execute(
        username: string,
        currentUserId?: string,
    ): Promise<GetProfileResult> {
        const profile = await this.profileRepository.findByUsername(username);

        if (!profile) throw new NotFoundError("Profile not found.");

        const isMe = currentUserId ? profile.userId === currentUserId : false;

        let isFollowing = false;
        if (currentUserId && !isMe) {
            isFollowing = await this.profileRepository.checkIsFollowing(
                currentUserId,
                profile.userId,
            );
        }

        return {
            profile,
            isMe,
            isFollowing,
        };
    }
}
