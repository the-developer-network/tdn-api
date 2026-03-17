export interface IProfileRepository {
    updateAvatar(userId: string, avatarUrl: string | null): Promise<void>;
    findAvatarByUserId(userId: string): Promise<string | null>;
}
