import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnfollowUserUseCase } from "@core/use-cases/follow-user/unfollow-user/unfollow-user.usecase";
import { BadRequestError, NotFoundError } from "@core/errors";
import type { IFollowRepository } from "@core/ports/repositories/follow.repository";
import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import { buildProfile } from "../../../helpers/mock-factories";

describe("UnfollowUserUseCase", () => {
    let useCase: UnfollowUserUseCase;
    let followRepo: Pick<
        IFollowRepository,
        "checkIsFollowing" | "unfollowUser" | "getFollowersCount"
    >;
    let profileRepo: Pick<IProfileRepository, "findByUserId">;

    beforeEach(() => {
        followRepo = {
            checkIsFollowing: vi.fn(),
            unfollowUser: vi.fn(),
            getFollowersCount: vi.fn().mockResolvedValue(10),
        };
        profileRepo = { findByUserId: vi.fn() };

        useCase = new UnfollowUserUseCase(
            followRepo as IFollowRepository,
            profileRepo as IProfileRepository,
        );
    });

    it("should throw NotFoundError when target profile does not exist", async () => {
        vi.mocked(profileRepo.findByUserId).mockResolvedValue(null);

        await expect(
            useCase.execute({ currentUserId: "user-1", targetId: "user-2" }),
        ).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError when user tries to unfollow themselves", async () => {
        vi.mocked(profileRepo.findByUserId).mockResolvedValue(
            buildProfile({ userId: "user-1" }),
        );

        await expect(
            useCase.execute({ currentUserId: "user-1", targetId: "user-1" }),
        ).rejects.toThrow(BadRequestError);
    });

    it("should unfollow user when currently following", async () => {
        vi.mocked(profileRepo.findByUserId).mockResolvedValue(
            buildProfile({ userId: "user-2" }),
        );
        vi.mocked(followRepo.checkIsFollowing).mockResolvedValue(true);
        vi.mocked(followRepo.unfollowUser).mockResolvedValue(undefined);

        const result = await useCase.execute({
            currentUserId: "user-1",
            targetId: "user-2",
        });

        expect(followRepo.unfollowUser).toHaveBeenCalledWith(
            "user-1",
            "user-2",
        );
        expect(result.followersCount).toBe(10);
    });

    it("should skip unfollow when not currently following (idempotent)", async () => {
        vi.mocked(profileRepo.findByUserId).mockResolvedValue(
            buildProfile({ userId: "user-2" }),
        );
        vi.mocked(followRepo.checkIsFollowing).mockResolvedValue(false);

        await useCase.execute({ currentUserId: "user-1", targetId: "user-2" });

        expect(followRepo.unfollowUser).not.toHaveBeenCalled();
    });

    it("should always return followersCount regardless of follow state", async () => {
        vi.mocked(profileRepo.findByUserId).mockResolvedValue(
            buildProfile({ userId: "user-2" }),
        );
        vi.mocked(followRepo.checkIsFollowing).mockResolvedValue(false);
        vi.mocked(followRepo.getFollowersCount).mockResolvedValue(5);

        const result = await useCase.execute({
            currentUserId: "user-1",
            targetId: "user-2",
        });

        expect(followRepo.getFollowersCount).toHaveBeenCalledWith("user-2");
        expect(result.followersCount).toBe(5);
    });
});
