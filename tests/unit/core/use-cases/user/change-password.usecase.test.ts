import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordUseCase } from "@core/use-cases/user/change-password";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { PasswordPort } from "@core/ports/services/password.port";
import { BadRequestError } from "@core/errors";

describe("ChangePasswordUseCase", () => {
    let useCase: ChangePasswordUseCase;
    let userRepository: Pick<
        IUserRepository,
        "findPasswordById" | "updatePassword"
    >;
    let passwordService: Pick<PasswordPort, "verify" | "hash">;

    beforeEach(() => {
        userRepository = {
            findPasswordById: vi.fn(),
            updatePassword: vi.fn().mockResolvedValue(undefined),
        };
        passwordService = {
            verify: vi.fn(),
            hash: vi.fn(),
        };
        useCase = new ChangePasswordUseCase(
            userRepository as IUserRepository,
            passwordService as PasswordPort,
        );
    });

    it("should throw BadRequestError when user has no password (social account)", async () => {
        vi.mocked(userRepository.findPasswordById).mockResolvedValue(null);

        await expect(
            useCase.execute({
                id: "user-1",
                currentPassword: "any",
                newPassword: "new_pass",
            }),
        ).rejects.toThrow(BadRequestError);

        expect(passwordService.verify).not.toHaveBeenCalled();
    });

    it("should include social provider hint in the error message", async () => {
        vi.mocked(userRepository.findPasswordById).mockResolvedValue(null);

        await expect(
            useCase.execute({
                id: "user-1",
                currentPassword: "any",
                newPassword: "new_pass",
            }),
        ).rejects.toThrow("social provider");
    });

    it("should throw BadRequestError when current password is invalid", async () => {
        vi.mocked(userRepository.findPasswordById).mockResolvedValue(
            "stored_hash",
        );
        vi.mocked(passwordService.verify).mockResolvedValue(false);

        await expect(
            useCase.execute({
                id: "user-1",
                currentPassword: "wrong_password",
                newPassword: "new_pass",
            }),
        ).rejects.toThrow(BadRequestError);

        expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });

    it("should throw BadRequestError when new password equals current password", async () => {
        vi.mocked(userRepository.findPasswordById).mockResolvedValue(
            "stored_hash",
        );
        vi.mocked(passwordService.verify).mockResolvedValue(true);

        await expect(
            useCase.execute({
                id: "user-1",
                currentPassword: "same_password",
                newPassword: "same_password",
            }),
        ).rejects.toThrow(BadRequestError);

        expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });

    it("should hash the new password and update it on happy path", async () => {
        vi.mocked(userRepository.findPasswordById).mockResolvedValue(
            "stored_hash",
        );
        vi.mocked(passwordService.verify).mockResolvedValue(true);
        vi.mocked(passwordService.hash).mockResolvedValue("new_hashed_pw");

        await useCase.execute({
            id: "user-1",
            currentPassword: "current_pass",
            newPassword: "new_pass",
        });

        expect(passwordService.hash).toHaveBeenCalledOnce();
        expect(passwordService.hash).toHaveBeenCalledWith("new_pass");
        expect(userRepository.updatePassword).toHaveBeenCalledOnce();
        expect(userRepository.updatePassword).toHaveBeenCalledWith(
            "user-1",
            "new_hashed_pw",
        );
    });

    it("should verify against the stored hash, not the plaintext input", async () => {
        vi.mocked(userRepository.findPasswordById).mockResolvedValue(
            "stored_hash",
        );
        vi.mocked(passwordService.verify).mockResolvedValue(true);
        vi.mocked(passwordService.hash).mockResolvedValue("new_hashed_pw");

        await useCase.execute({
            id: "user-1",
            currentPassword: "current_pass",
            newPassword: "new_pass",
        });

        expect(passwordService.verify).toHaveBeenCalledWith(
            "current_pass",
            "stored_hash",
        );
    });
});
