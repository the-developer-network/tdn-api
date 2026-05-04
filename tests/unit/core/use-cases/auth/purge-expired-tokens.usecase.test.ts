import { beforeEach, describe, expect, it, vi } from "vitest";
import { PurgeExpiredTokensUseCase } from "@core/use-cases/auth/purge-expired-tokens/purge-expires-tokens.use.case";
import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";

describe("PurgeExpiredTokensUseCase", () => {
    let useCase: PurgeExpiredTokensUseCase;
    let refreshTokenRepo: Pick<IRefreshTokenRepository, "deleteExpiredTokens">;

    beforeEach(() => {
        refreshTokenRepo = { deleteExpiredTokens: vi.fn() };
        useCase = new PurgeExpiredTokensUseCase(
            refreshTokenRepo as IRefreshTokenRepository,
        );
    });

    it("should return the number of deleted tokens", async () => {
        vi.mocked(refreshTokenRepo.deleteExpiredTokens).mockResolvedValue(5);

        const result = await useCase.execute();

        expect(result).toBe(5);
    });

    it("should return 0 when no expired tokens exist", async () => {
        vi.mocked(refreshTokenRepo.deleteExpiredTokens).mockResolvedValue(0);

        const result = await useCase.execute();

        expect(result).toBe(0);
    });

    it("should delegate to refreshTokenRepository.deleteExpiredTokens", async () => {
        vi.mocked(refreshTokenRepo.deleteExpiredTokens).mockResolvedValue(3);

        await useCase.execute();

        expect(refreshTokenRepo.deleteExpiredTokens).toHaveBeenCalledOnce();
    });
});
