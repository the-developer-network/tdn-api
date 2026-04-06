export interface SuggestedUserItem {
    userId: string;
    username: string;
    fullName: string;
    avatarUrl: string;
    bannerUrl: string;
    bio: string | null;
    followersCount: number;
    isFollowing: false;
    isMe: false;
}
