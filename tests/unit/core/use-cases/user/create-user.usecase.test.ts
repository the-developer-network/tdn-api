import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateUserUseCase } from "@core/use-cases/user/create-user";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import { buildUser } from "../../../helpers/mock-factories";

describe("CreateUserUseCase", () => {
    let useCase: CreateUserUseCase;
    let userRepository: Pick<IUserRepository, "create">;

    beforeEach(() => {
        userRepository = {
            create: vi.fn(),
        };
        useCase = new CreateUserUseCase(userRepository as IUserRepository);
    });

    it("should call repository.create with the provided data and return the user", async () => {
        const expectedUser = buildUser({
            email: "john@example.com",
            username: "johndoe",
            passwordHash: "hashed_pw",
        });
        vi.mocked(userRepository.create).mockResolvedValue(expectedUser);

        const result = await useCase.execute({
            email: "john@example.com",
            username: "johndoe",
            passwordHash: "hashed_pw",
        });

        expect(userRepository.create).toHaveBeenCalledOnce();
        expect(userRepository.create).toHaveBeenCalledWith({
            email: "john@example.com",
            username: "johndoe",
            passwordHash: "hashed_pw",
        });
        expect(result).toBe(expectedUser);
    });

    it("should support null passwordHash for OAuth users", async () => {
        const oauthUser = buildUser({ passwordHash: null });
        vi.mocked(userRepository.create).mockResolvedValue(oauthUser);

        const result = await useCase.execute({
            email: "oauth@example.com",
            username: "oauthuser",
            passwordHash: null,
        });

        expect(userRepository.create).toHaveBeenCalledWith({
            email: "oauth@example.com",
            username: "oauthuser",
            passwordHash: null,
        });
        expect(result).toBe(oauthUser);
    });

    it("should propagate errors thrown by the repository", async () => {
        vi.mocked(userRepository.create).mockRejectedValue(
            new Error("Email already exists"),
        );

        await expect(
            useCase.execute({
                email: "dupe@example.com",
                username: "dupeuser",
                passwordHash: "hash",
            }),
        ).rejects.toThrow("Email already exists");
    });
});
