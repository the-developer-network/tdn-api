import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import type { SearchProfileInput } from "./search-profile-usecase.input";
import type { SearchProfileOutput } from "./search-profile-usecase.output";

export class SearchProfilesUseCase {
    constructor(private readonly profileRepository: IProfileRepository) {}

    /**
     * Executes the profile search query and maps the 'isMe' flag for each result.
     * @param query - The search text (username or full name).
     * @param currentUserId - (Optional) The ID of the user making the request.
     * @param limit - (Optional) Maximum number of results.
     */
    async execute(input: SearchProfileInput): Promise<SearchProfileOutput[]> {
        const sanitizedQuery = input.query.trim();
        if (sanitizedQuery.length < 2) {
            return [];
        }

        const profiles = await this.profileRepository.search(
            sanitizedQuery,
            input.limit,
        );

        return profiles.map((profile) => ({
            profile,
            isMe: input.currentUserId
                ? profile.userId === input.currentUserId
                : false,
        }));
    }
}
