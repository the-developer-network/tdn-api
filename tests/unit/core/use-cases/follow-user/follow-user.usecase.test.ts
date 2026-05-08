import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowUserUseCase } from "@core/use-cases/follow-user/follow-user/follow-user.usecase";
import { BadRequestError, NotFoundError } from "@core/errors";
import type { IFollowRepository } from "@core/ports/repositories/follow.repository";
import type { INotificationRepository } from "@core/ports/repositories/notification.repository";
import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import type { RealtimePort } from "@core/ports/services/realtime.port";
import { buildProfile } from "../../../helpers/mock-factories";

describe("FollowUserUseCase", () => {
    let useCase: FollowUserUseCase;
    let followRepo: Pick<
        IFollowRepository,
        "checkIsFollowing" | "followUser" | "getFollowersCount"
    >;
    let notificationRepo: Pick<INotificationRepository, "create">;
    let realtimeSvc: Pick<RealtimePort, "emitToUser">;
    let profileRepo: Pick<IProfileRepository, "findByUserId">;

    beforeEach(() => {
        followRepo = {
            checkIsFollowing: vi.fn(),
            followUser: vi.fn(),
            getFollowersCount: vi.fn().mockResolvedValue(42),
        };
        notificationRepo = { create: vi.fn() };
        realtimeSvc = { emitToUser: vi.fn() };
        profileRepo = {
            findByUserId: vi
                .fn()
                .mockResolvedValue(buildProfile({ userId: "user-2" })),
        };

        useCase = new FollowUserUseCase(
            followRepo as IFollowRepository,
            notificationRepo as INotificationRepository,
            realtimeSvc as RealtimePort,
            profileRepo as IProfileRepository,
        );
    });

    it("should throw BadRequestError when user tries to follow themselves", async () => {
        await expect(
            useCase.execute({ currentUserId: "user-1", targetId: "user-1" }),
        ).rejects.toThrow(BadRequestError);
    });

    it("should throw NotFoundError when target user does not exist", async () => {
        vi.mocked(profileRepo.findByUserId).mockResolvedValue(null);

        await expect(
            useCase.execute({ currentUserId: "user-1", targetId: "user-2" }),
        ).rejects.toThrow(NotFoundError);

        expect(followRepo.checkIsFollowing).not.toHaveBeenCalled();
    });

    it("should follow user, create notification and emit realtime when not already following", async () => {
        vi.mocked(followRepo.checkIsFollowing).mockResolvedValue(false);
        vi.mocked(followRepo.followUser).mockResolvedValue(undefined);
        vi.mocked(notificationRepo.create).mockResolvedValue(undefined);

        const result = await useCase.execute({
            currentUserId: "user-1",
            targetId: "user-2",
        });

        expect(followRepo.followUser).toHaveBeenCalledWith("user-1", "user-2");
        expect(notificationRepo.create).toHaveBeenCalledOnce();
        expect(realtimeSvc.emitToUser).toHaveBeenCalledWith(
            "user-2",
            "new-notification",
            expect.objectContaining({ type: "FOLLOW", issuerId: "user-1" }),
        );
        expect(result.followersCount).toBe(42);
    });

    it("should skip follow and notification when already following (idempotent)", async () => {
        vi.mocked(followRepo.checkIsFollowing).mockResolvedValue(true);

        const result = await useCase.execute({
            currentUserId: "user-1",
            targetId: "user-2",
        });

        expect(followRepo.followUser).not.toHaveBeenCalled();
        expect(notificationRepo.create).not.toHaveBeenCalled();
        expect(realtimeSvc.emitToUser).not.toHaveBeenCalled();
        expect(result.followersCount).toBe(42);
    });

    it("should always return followersCount regardless of follow state", async () => {
        vi.mocked(followRepo.checkIsFollowing).mockResolvedValue(true);
        vi.mocked(followRepo.getFollowersCount).mockResolvedValue(100);

        const result = await useCase.execute({
            currentUserId: "user-1",
            targetId: "user-2",
        });

        expect(followRepo.getFollowersCount).toHaveBeenCalledWith("user-2");
        expect(result.followersCount).toBe(100);
    });
});
