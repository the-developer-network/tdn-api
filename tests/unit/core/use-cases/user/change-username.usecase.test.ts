import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangeUsernameUseCase } from "@core/use-cases/user/change-username";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import { BadRequestError, NotFoundError } from "@core/errors";
import { buildUser } from "../../../helpers/mock-factories";

describe("ChangeUsernameUseCase", () => {
    let useCase: ChangeUsernameUseCase;
    let userRepository: Pick<IUserRepository, "findById" | "updateUsername">;

    beforeEach(() => {
        userRepository = {
            findById: vi.fn(),
            updateUsername: vi.fn().mockResolvedValue(undefined),
        };
        useCase = new ChangeUsernameUseCase(userRepository as IUserRepository);
    });

    it("should throw NotFoundError when user does not exist", async () => {
        vi.mocked(userRepository.findById).mockResolvedValue(null);

        await expect(
            useCase.execute({ id: "user-1", newUsername: "newusername" }),
        ).rejects.toThrow(NotFoundError);

        expect(userRepository.updateUsername).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when new username equals current username", async () => {
        const user = buildUser({ username: "sameuser" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);

        await expect(
            useCase.execute({ id: "user-1", newUsername: "sameuser" }),
        ).rejects.toThrow(BadRequestError);

        expect(userRepository.updateUsername).not.toHaveBeenCalled();
    });

    it("should call updateUsername with the correct id and new username", async () => {
        const user = buildUser({ username: "oldusername" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);

        await useCase.execute({ id: "user-1", newUsername: "newusername" });

        expect(userRepository.updateUsername).toHaveBeenCalledOnce();
        expect(userRepository.updateUsername).toHaveBeenCalledWith(
            "user-1",
            "newusername",
        );
    });

    it("should resolve without returning a value", async () => {
        const user = buildUser({ username: "oldusername" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);

        const result = await useCase.execute({
            id: "user-1",
            newUsername: "newusername",
        });

        expect(result).toBeUndefined();
    });

    it("should propagate conflict errors thrown by the repository", async () => {
        const user = buildUser({ username: "oldusername" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);
        vi.mocked(userRepository.updateUsername).mockRejectedValue(
            new Error("Username already taken"),
        );

        await expect(
            useCase.execute({ id: "user-1", newUsername: "takenuser" }),
        ).rejects.toThrow("Username already taken");
    });
});
