import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkAllNotificationsAsReadUseCase } from "@core/use-cases/notification/mark-all";
import type { INotificationRepository } from "@core/ports/repositories/notification.repository";

describe("MarkAllNotificationsAsReadUseCase", () => {
    let useCase: MarkAllNotificationsAsReadUseCase;
    let notificationRepo: Pick<INotificationRepository, "markAllAsRead">;

    beforeEach(() => {
        notificationRepo = {
            markAllAsRead: vi.fn(),
        };
        useCase = new MarkAllNotificationsAsReadUseCase(
            notificationRepo as INotificationRepository,
        );
    });

    it("should call markAllAsRead with the correct userId", async () => {
        vi.mocked(notificationRepo.markAllAsRead).mockResolvedValue(undefined);

        await useCase.execute({ userId: "user-1" });

        expect(notificationRepo.markAllAsRead).toHaveBeenCalledOnce();
        expect(notificationRepo.markAllAsRead).toHaveBeenCalledWith("user-1");
    });

    it("should resolve without returning a value", async () => {
        vi.mocked(notificationRepo.markAllAsRead).mockResolvedValue(undefined);

        const result = await useCase.execute({ userId: "user-1" });

        expect(result).toBeUndefined();
    });

    it("should propagate repository errors", async () => {
        const repoError = new Error("Database connection lost");
        vi.mocked(notificationRepo.markAllAsRead).mockRejectedValue(repoError);

        await expect(useCase.execute({ userId: "user-1" })).rejects.toThrow(
            "Database connection lost",
        );
    });
});
