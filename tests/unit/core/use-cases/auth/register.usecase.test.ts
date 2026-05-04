import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterUseCase } from "@core/use-cases/auth/register/register.usecase";
import type { PasswordPort } from "@core/ports/services/password.port";
import type { CreateUserUseCase } from "@core/use-cases/user/create-user/create-user.usecase";
import { buildUser } from "../../../helpers/mock-factories";

describe("RegisterUseCase", () => {
    let useCase: RegisterUseCase;
    let passwordSvc: Pick<PasswordPort, "hash">;
    let createUserUseCase: Pick<CreateUserUseCase, "execute">;

    const input = {
        username: "testuser",
        email: "test@example.com",
        password: "plain_password",
    };

    beforeEach(() => {
        passwordSvc = { hash: vi.fn() };
        createUserUseCase = { execute: vi.fn() };
        useCase = new RegisterUseCase(
            createUserUseCase as CreateUserUseCase,
            passwordSvc as PasswordPort,
        );
    });

    it("should hash the password and call createUserUseCase with correct args", async () => {
        vi.mocked(passwordSvc.hash).mockResolvedValue("hashed_password");
        const mockUser = buildUser();
        vi.mocked(createUserUseCase.execute).mockResolvedValue(mockUser);
        const result = await useCase.execute(input);
        expect(passwordSvc.hash).toHaveBeenCalledWith("plain_password");
        expect(createUserUseCase.execute).toHaveBeenCalledWith({
            username: input.username,
            email: input.email,
            passwordHash: "hashed_password",
        });
        expect(result).toBe(mockUser);
    });

    it("should return the user returned by createUserUseCase", async () => {
        vi.mocked(passwordSvc.hash).mockResolvedValue("hashed_password");
        const mockUser = buildUser();
        vi.mocked(createUserUseCase.execute).mockResolvedValue(mockUser);
        const result = await useCase.execute(input);
        expect(result).toBe(mockUser);
    });

    it("should propagate error when createUserUseCase throws", async () => {
        vi.mocked(passwordSvc.hash).mockResolvedValue("hashed_password");
        vi.mocked(createUserUseCase.execute).mockRejectedValue(
            new Error("db error"),
        );
        await expect(useCase.execute(input)).rejects.toThrow("db error");
    });
});
