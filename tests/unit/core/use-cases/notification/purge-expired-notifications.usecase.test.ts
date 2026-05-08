import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PurgeExpiredNotificationsUseCase } from "@core/use-cases/notification/purge-expired";
import type { INotificationRepository } from "@core/ports/repositories/notification.repository";

describe("PurgeExpiredNotificationsUseCase", () => {
    let useCase: PurgeExpiredNotificationsUseCase;
    let notificationRepo: Pick<
        INotificationRepository,
        "deleteExpiredNotifications"
    >;

    beforeEach(() => {
        vi.useFakeTimers();
        notificationRepo = {
            deleteExpiredNotifications: vi.fn(),
        };
        useCase = new PurgeExpiredNotificationsUseCase(
            notificationRepo as INotificationRepository,
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should call deleteExpiredNotifications with the correct cutoff date", async () => {
        const now = new Date("2026-05-07T12:00:00.000Z");
        vi.setSystemTime(now);

        const expectedCutoff = new Date("2026-05-07T12:00:00.000Z");
        expectedCutoff.setDate(expectedCutoff.getDate() - 30);

        vi.mocked(
            notificationRepo.deleteExpiredNotifications,
        ).mockResolvedValue(5);

        await useCase.execute(30);

        expect(
            notificationRepo.deleteExpiredNotifications,
        ).toHaveBeenCalledOnce();
        expect(
            notificationRepo.deleteExpiredNotifications,
        ).toHaveBeenCalledWith(expectedCutoff);
    });

    it("should return the count of deleted notifications", async () => {
        vi.setSystemTime(new Date("2026-05-07T12:00:00.000Z"));
        vi.mocked(
            notificationRepo.deleteExpiredNotifications,
        ).mockResolvedValue(42);

        const result = await useCase.execute(7);

        expect(result).toBe(42);
    });

    it("should return 0 when no notifications are deleted", async () => {
        vi.setSystemTime(new Date("2026-05-07T12:00:00.000Z"));
        vi.mocked(
            notificationRepo.deleteExpiredNotifications,
        ).mockResolvedValue(0);

        const result = await useCase.execute(7);

        expect(result).toBe(0);
    });

    it("should propagate repository errors", async () => {
        vi.setSystemTime(new Date("2026-05-07T12:00:00.000Z"));
        const repoError = new Error("Database connection lost");
        vi.mocked(
            notificationRepo.deleteExpiredNotifications,
        ).mockRejectedValue(repoError);

        await expect(useCase.execute(30)).rejects.toThrow(
            "Database connection lost",
        );
    });
});
