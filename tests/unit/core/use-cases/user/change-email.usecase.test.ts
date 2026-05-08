import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangeEmailUseCase } from "@core/use-cases/user/change-email";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import { BadRequestError, NotFoundError } from "@core/errors";
import { buildUser } from "../../../helpers/mock-factories";

describe("ChangeEmailUseCase", () => {
    let useCase: ChangeEmailUseCase;
    let userRepository: Pick<IUserRepository, "findById" | "updateEmail">;

    beforeEach(() => {
        userRepository = {
            findById: vi.fn(),
            updateEmail: vi.fn().mockResolvedValue(undefined),
        };
        useCase = new ChangeEmailUseCase(userRepository as IUserRepository);
    });

    it("should throw NotFoundError when user does not exist", async () => {
        vi.mocked(userRepository.findById).mockResolvedValue(null);

        await expect(
            useCase.execute({ id: "user-1", newEmail: "new@example.com" }),
        ).rejects.toThrow(NotFoundError);

        expect(userRepository.updateEmail).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when new email equals current email", async () => {
        const user = buildUser({ email: "same@example.com" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);

        await expect(
            useCase.execute({ id: "user-1", newEmail: "same@example.com" }),
        ).rejects.toThrow(BadRequestError);

        expect(userRepository.updateEmail).not.toHaveBeenCalled();
    });

    it("should call updateEmail with the correct id and new email", async () => {
        const user = buildUser({ email: "old@example.com" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);

        await useCase.execute({ id: "user-1", newEmail: "new@example.com" });

        expect(userRepository.updateEmail).toHaveBeenCalledOnce();
        expect(userRepository.updateEmail).toHaveBeenCalledWith(
            "user-1",
            "new@example.com",
        );
    });

    it("should resolve without returning a value", async () => {
        const user = buildUser({ email: "old@example.com" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);

        const result = await useCase.execute({
            id: "user-1",
            newEmail: "new@example.com",
        });

        expect(result).toBeUndefined();
    });

    it("should propagate errors thrown by the repository", async () => {
        const user = buildUser({ email: "old@example.com" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);
        vi.mocked(userRepository.updateEmail).mockRejectedValue(
            new Error("DB constraint violation"),
        );

        await expect(
            useCase.execute({ id: "user-1", newEmail: "taken@example.com" }),
        ).rejects.toThrow("DB constraint violation");
    });
});
