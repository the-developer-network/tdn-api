import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpdateProfileUseCase } from "@core/use-cases/profile/update-profil";
import type { IProfileRepository } from "@core/ports/repositories/profile.repository";

describe("UpdateProfileUseCase", () => {
    let useCase: UpdateProfileUseCase;
    let profileRepository: Pick<IProfileRepository, "update">;

    beforeEach(() => {
        profileRepository = {
            update: vi.fn().mockResolvedValue(undefined),
        };
        useCase = new UpdateProfileUseCase(
            profileRepository as IProfileRepository,
        );
    });

    it("should call repository.update with the userId and input", async () => {
        const input = {
            userId: "user-1",
            fullName: "John Doe",
            bio: "A developer",
            location: "Istanbul",
            socials: { twitter: "https://twitter.com/johndoe" },
        };

        await useCase.execute(input);

        expect(profileRepository.update).toHaveBeenCalledOnce();
        expect(profileRepository.update).toHaveBeenCalledWith("user-1", input);
    });

    it("should resolve without returning a value", async () => {
        const result = await useCase.execute({ userId: "user-1" });

        expect(result).toBeUndefined();
    });

    it("should work with only userId provided (all optional fields omitted)", async () => {
        await useCase.execute({ userId: "user-1" });

        expect(profileRepository.update).toHaveBeenCalledWith("user-1", {
            userId: "user-1",
        });
    });

    it("should support null values for clearable fields", async () => {
        await useCase.execute({
            userId: "user-1",
            bio: null,
            location: null,
            socials: null,
        });

        expect(profileRepository.update).toHaveBeenCalledWith("user-1", {
            userId: "user-1",
            bio: null,
            location: null,
            socials: null,
        });
    });

    it("should propagate errors thrown by the repository", async () => {
        vi.mocked(profileRepository.update).mockRejectedValue(
            new Error("DB error"),
        );

        await expect(useCase.execute({ userId: "user-1" })).rejects.toThrow(
            "DB error",
        );
    });
});
