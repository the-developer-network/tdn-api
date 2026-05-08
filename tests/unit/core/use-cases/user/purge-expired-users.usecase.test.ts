import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurgeExpiredUsersUseCase } from "@core/use-cases/user/purge-expired-users";
import type { IUserRepository } from "@core/ports/repositories/user.repository";

describe("PurgeExpiredUsersUseCase", () => {
    let useCase: PurgeExpiredUsersUseCase;
    let userRepository: Pick<IUserRepository, "deleteExpiredUser">;

    beforeEach(() => {
        userRepository = {
            deleteExpiredUser: vi.fn(),
        };
        useCase = new PurgeExpiredUsersUseCase(
            userRepository as IUserRepository,
        );
    });

    it("should call deleteExpiredUser once", async () => {
        vi.mocked(userRepository.deleteExpiredUser).mockResolvedValue(0);

        await useCase.execute();

        expect(userRepository.deleteExpiredUser).toHaveBeenCalledOnce();
    });

    it("should return the count of purged users", async () => {
        vi.mocked(userRepository.deleteExpiredUser).mockResolvedValue(5);

        const result = await useCase.execute();

        expect(result).toBe(5);
    });

    it("should return 0 when no expired users exist", async () => {
        vi.mocked(userRepository.deleteExpiredUser).mockResolvedValue(0);

        const result = await useCase.execute();

        expect(result).toBe(0);
    });

    it("should propagate errors thrown by the repository", async () => {
        vi.mocked(userRepository.deleteExpiredUser).mockRejectedValue(
            new Error("DB error"),
        );

        await expect(useCase.execute()).rejects.toThrow("DB error");
    });
});
