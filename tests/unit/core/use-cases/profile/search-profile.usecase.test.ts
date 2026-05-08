import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchProfilesUseCase } from "@core/use-cases/profile/search-profile";
import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import { buildProfile } from "../../../helpers/mock-factories";

describe("SearchProfilesUseCase", () => {
    let useCase: SearchProfilesUseCase;
    let profileRepository: Pick<IProfileRepository, "search">;

    beforeEach(() => {
        profileRepository = {
            search: vi.fn().mockResolvedValue([]),
        };
        useCase = new SearchProfilesUseCase(
            profileRepository as IProfileRepository,
        );
    });

    it("should return empty array when query is less than 2 characters", async () => {
        const result = await useCase.execute({ query: "a" });

        expect(result).toEqual([]);
        expect(profileRepository.search).not.toHaveBeenCalled();
    });

    it("should return empty array when query is empty", async () => {
        const result = await useCase.execute({ query: "" });

        expect(result).toEqual([]);
        expect(profileRepository.search).not.toHaveBeenCalled();
    });

    it("should return empty array when query is only whitespace (trim < 2)", async () => {
        const result = await useCase.execute({ query: " " });

        expect(result).toEqual([]);
        expect(profileRepository.search).not.toHaveBeenCalled();
    });

    it("should call repository.search when query is 2+ characters after trim", async () => {
        await useCase.execute({ query: "jo" });

        expect(profileRepository.search).toHaveBeenCalledOnce();
    });

    it("should pass trimmed query to repository.search", async () => {
        await useCase.execute({ query: "  john  " });

        expect(profileRepository.search).toHaveBeenCalledWith(
            "john",
            undefined,
        );
    });

    it("should pass the limit to repository.search when provided", async () => {
        await useCase.execute({ query: "john", limit: 5 });

        expect(profileRepository.search).toHaveBeenCalledWith("john", 5);
    });

    it("should set isMe to true when profile.userId matches currentUserId", async () => {
        const profile = buildProfile({ userId: "user-1" });
        vi.mocked(profileRepository.search).mockResolvedValue([profile]);

        const result = await useCase.execute({
            query: "test",
            currentUserId: "user-1",
        });

        expect(result[0].isMe).toBe(true);
    });

    it("should set isMe to false when profile.userId does not match currentUserId", async () => {
        const profile = buildProfile({ userId: "user-2" });
        vi.mocked(profileRepository.search).mockResolvedValue([profile]);

        const result = await useCase.execute({
            query: "test",
            currentUserId: "user-1",
        });

        expect(result[0].isMe).toBe(false);
    });

    it("should set isMe to false when currentUserId is not provided", async () => {
        const profile = buildProfile({ userId: "user-1" });
        vi.mocked(profileRepository.search).mockResolvedValue([profile]);

        const result = await useCase.execute({ query: "test" });

        expect(result[0].isMe).toBe(false);
    });

    it("should return the profile entity inside each result", async () => {
        const profile = buildProfile({ userId: "user-1" });
        vi.mocked(profileRepository.search).mockResolvedValue([profile]);

        const result = await useCase.execute({ query: "test" });

        expect(result[0].profile).toBe(profile);
    });
});
