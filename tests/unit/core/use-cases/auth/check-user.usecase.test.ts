import { describe, it, expect, beforeEach, vi } from "vitest";
import { CheckUserUseCase } from "@core/use-cases/auth/check-user/check-user.usecase";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import { buildUser } from "../../../helpers/mock-factories";

describe("CheckUserUseCase", () => {
    let useCase: CheckUserUseCase;
    let userRepo: Pick<IUserRepository, "findByIdentifier">;

    beforeEach(() => {
        userRepo = { findByIdentifier: vi.fn() };
        useCase = new CheckUserUseCase(userRepo as IUserRepository);
    });

    it("should return true when user exists", async () => {
        vi.mocked(userRepo.findByIdentifier).mockResolvedValue(buildUser());

        const result = await useCase.execute({ identifier: "testuser" });

        expect(result).toBe(true);
    });

    it("should return false when user does not exist", async () => {
        vi.mocked(userRepo.findByIdentifier).mockResolvedValue(null);

        const result = await useCase.execute({ identifier: "nonexistent" });

        expect(result).toBe(false);
    });

    it("should call repository with the given identifier", async () => {
        vi.mocked(userRepo.findByIdentifier).mockResolvedValue(null);

        await useCase.execute({ identifier: "search_term" });

        expect(userRepo.findByIdentifier).toHaveBeenCalledWith("search_term");
    });
});
