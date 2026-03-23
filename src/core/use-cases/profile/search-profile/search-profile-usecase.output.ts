import type { Profile } from "@core/entities/profile.entitiy";

export interface SearchProfileOutput {
    profile: Profile;
    isMe: boolean;
}
