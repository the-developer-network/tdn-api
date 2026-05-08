import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetMeUserUseCase } from "@core/use-cases/user/get-me";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { IOAuthAccountRepository } from "@core/ports/repositories/oauth-account.repository";
import { UnauthorizedError } from "@core/errors";
import { buildUser } from "../../../helpers/mock-factories";

describe("GetMeUserUseCase", () => {
    let useCase: GetMeUserUseCase;
    let userRepository: Pick<IUserRepository, "findById">;
    let oauthAccountRepository: Pick<
        IOAuthAccountRepository,
        "findProvidersByUserId"
    >;

    beforeEach(() => {
        userRepository = {
            findById: vi.fn(),
        };
        oauthAccountRepository = {
            findProvidersByUserId: vi.fn(),
        };
        useCase = new GetMeUserUseCase(
            userRepository as IUserRepository,
            oauthAccountRepository as IOAuthAccountRepository,
        );
    });

    it("should throw UnauthorizedError when user is not found", async () => {
        vi.mocked(userRepository.findById).mockResolvedValue(null);

        await expect(useCase.execute({ id: "user-1" })).rejects.toThrow(
            UnauthorizedError,
        );

        expect(
            oauthAccountRepository.findProvidersByUserId,
        ).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedError with session message when user is not found", async () => {
        vi.mocked(userRepository.findById).mockResolvedValue(null);

        await expect(useCase.execute({ id: "user-1" })).rejects.toThrow(
            "Invalid or expired session.",
        );
    });

    it("should return user data built from entity with providers on happy path", async () => {
        const user = buildUser({
            id: "user-1",
            email: "test@example.com",
            username: "testuser",
            isEmailVerified: true,
            isBot: false,
        });
        vi.mocked(userRepository.findById).mockResolvedValue(user);
        vi.mocked(
            oauthAccountRepository.findProvidersByUserId,
        ).mockResolvedValue(["google", "github"]);

        const result = await useCase.execute({ id: "user-1" });

        expect(result).toEqual({
            id: user.id,
            username: user.username,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            isBot: user.isBot,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            providers: ["google", "github"],
        });
    });

    it("should call findById with the provided id", async () => {
        const user = buildUser({ id: "user-42" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);
        vi.mocked(
            oauthAccountRepository.findProvidersByUserId,
        ).mockResolvedValue([]);

        await useCase.execute({ id: "user-42" });

        expect(userRepository.findById).toHaveBeenCalledOnce();
        expect(userRepository.findById).toHaveBeenCalledWith("user-42");
    });

    it("should call findProvidersByUserId with the user id", async () => {
        const user = buildUser({ id: "user-1" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);
        vi.mocked(
            oauthAccountRepository.findProvidersByUserId,
        ).mockResolvedValue([]);

        await useCase.execute({ id: "user-1" });

        expect(
            oauthAccountRepository.findProvidersByUserId,
        ).toHaveBeenCalledOnce();
        expect(
            oauthAccountRepository.findProvidersByUserId,
        ).toHaveBeenCalledWith("user-1");
    });

    it("should return empty providers array when user has no OAuth accounts", async () => {
        const user = buildUser({ id: "user-1" });
        vi.mocked(userRepository.findById).mockResolvedValue(user);
        vi.mocked(
            oauthAccountRepository.findProvidersByUserId,
        ).mockResolvedValue([]);

        const result = await useCase.execute({ id: "user-1" });

        expect(result.providers).toEqual([]);
    });

    it("should not include passwordHash or deletedAt in the output", async () => {
        const user = buildUser({
            id: "user-1",
            passwordHash: "secret_hash",
            deletedAt: null,
        });
        vi.mocked(userRepository.findById).mockResolvedValue(user);
        vi.mocked(
            oauthAccountRepository.findProvidersByUserId,
        ).mockResolvedValue([]);

        const result = await useCase.execute({ id: "user-1" });

        expect(result).not.toHaveProperty("passwordHash");
        expect(result).not.toHaveProperty("deletedAt");
    });
});
