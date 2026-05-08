import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetUserNotificationUseCase } from "@core/use-cases/notification/get-user";
import type { INotificationRepository } from "@core/ports/repositories/notification.repository";
import { buildNotification } from "../../../helpers/mock-factories";

describe("GetUserNotificationUseCase", () => {
    let useCase: GetUserNotificationUseCase;
    let notificationRepo: Pick<
        INotificationRepository,
        "findAllByUserId" | "countByUserId"
    >;

    beforeEach(() => {
        notificationRepo = {
            findAllByUserId: vi.fn(),
            countByUserId: vi.fn(),
        };
        useCase = new GetUserNotificationUseCase(
            notificationRepo as INotificationRepository,
        );
    });

    it("should return empty notifications when user has none", async () => {
        vi.mocked(notificationRepo.findAllByUserId).mockResolvedValue([]);
        vi.mocked(notificationRepo.countByUserId).mockResolvedValue(0);

        const result = await useCase.execute({
            userId: "user-1",
            page: 1,
            limit: 10,
        });

        expect(result.notifications).toEqual([]);
        expect(result.total).toBe(0);
    });

    it("should return notifications and total for the given user", async () => {
        const notifications = [
            buildNotification({ recipientId: "user-1" }),
            buildNotification({ recipientId: "user-1" }),
        ];
        vi.mocked(notificationRepo.findAllByUserId).mockResolvedValue(
            notifications,
        );
        vi.mocked(notificationRepo.countByUserId).mockResolvedValue(2);

        const result = await useCase.execute({
            userId: "user-1",
            page: 1,
            limit: 10,
        });

        expect(result.notifications).toBe(notifications);
        expect(result.total).toBe(2);
    });

    it("should calculate skip correctly for page 1", async () => {
        vi.mocked(notificationRepo.findAllByUserId).mockResolvedValue([]);
        vi.mocked(notificationRepo.countByUserId).mockResolvedValue(0);

        await useCase.execute({ userId: "user-1", page: 1, limit: 10 });

        expect(notificationRepo.findAllByUserId).toHaveBeenCalledWith({
            userId: "user-1",
            take: 10,
            skip: 0,
        });
    });

    it("should calculate skip correctly for subsequent pages", async () => {
        vi.mocked(notificationRepo.findAllByUserId).mockResolvedValue([]);
        vi.mocked(notificationRepo.countByUserId).mockResolvedValue(0);

        await useCase.execute({ userId: "user-1", page: 3, limit: 5 });

        expect(notificationRepo.findAllByUserId).toHaveBeenCalledWith({
            userId: "user-1",
            take: 5,
            skip: 10,
        });
    });

    it("should call countByUserId and findAllByUserId in parallel", async () => {
        const order: string[] = [];

        vi.mocked(notificationRepo.findAllByUserId).mockImplementation(
            async () => {
                order.push("findAll");
                return [];
            },
        );
        vi.mocked(notificationRepo.countByUserId).mockImplementation(
            async () => {
                order.push("count");
                return 0;
            },
        );

        await useCase.execute({ userId: "user-1", page: 1, limit: 10 });

        expect(order).toContain("findAll");
        expect(order).toContain("count");
        expect(notificationRepo.countByUserId).toHaveBeenCalledWith("user-1");
    });
});
