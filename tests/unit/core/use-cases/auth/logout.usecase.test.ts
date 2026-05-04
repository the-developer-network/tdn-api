import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutUseCase } from "@core/use-cases/auth/logout/logout.usecase";
import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";
import type { AuthTokenPort } from "@core/ports/services/auth-token.port";
import { buildRefreshToken } from "../../../helpers/mock-factories";

describe("LogoutUseCase", () => {
    let useCase: LogoutUseCase;
    let refreshTokenRepo: Pick<
        IRefreshTokenRepository,
        "findByTokenHash" | "update"
    >;
    let authTokenSvc: Pick<AuthTokenPort, "hashRefreshSecret">;

    const input = { token: "raw_refresh_token" };

    beforeEach(() => {
        refreshTokenRepo = {
            findByTokenHash: vi.fn(),
            update: vi.fn(),
        };
        authTokenSvc = { hashRefreshSecret: vi.fn() };
        useCase = new LogoutUseCase(
            refreshTokenRepo as IRefreshTokenRepository,
            authTokenSvc as AuthTokenPort,
        );
    });

    it("should do nothing when token is empty string", async () => {
        await useCase.execute({ token: "" });

        expect(authTokenSvc.hashRefreshSecret).not.toHaveBeenCalled();
        expect(refreshTokenRepo.findByTokenHash).not.toHaveBeenCalled();
    });

    it("should hash the token and look it up by hash", async () => {
        vi.mocked(authTokenSvc.hashRefreshSecret).mockReturnValue(
            "hashed_token",
        );
        vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(null);

        await useCase.execute(input);

        expect(authTokenSvc.hashRefreshSecret).toHaveBeenCalledWith(
            "raw_refresh_token",
        );
        expect(refreshTokenRepo.findByTokenHash).toHaveBeenCalledWith(
            "hashed_token",
        );
    });

    it("should do nothing when token is not found", async () => {
        vi.mocked(authTokenSvc.hashRefreshSecret).mockReturnValue(
            "hashed_token",
        );
        vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(null);

        await useCase.execute(input);

        expect(refreshTokenRepo.update).not.toHaveBeenCalled();
    });

    it("should do nothing when token is already revoked", async () => {
        const revokedToken = buildRefreshToken({ isRevoked: true });
        vi.mocked(authTokenSvc.hashRefreshSecret).mockReturnValue(
            "hashed_token",
        );
        vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(
            revokedToken,
        );

        await useCase.execute(input);

        expect(refreshTokenRepo.update).not.toHaveBeenCalled();
    });

    it("should revoke and update the token when found and active", async () => {
        const activeToken = buildRefreshToken({ isRevoked: false });
        vi.mocked(authTokenSvc.hashRefreshSecret).mockReturnValue(
            "hashed_token",
        );
        vi.mocked(refreshTokenRepo.findByTokenHash).mockResolvedValue(
            activeToken,
        );
        vi.mocked(refreshTokenRepo.update).mockResolvedValue(undefined);

        await useCase.execute(input);

        expect(activeToken.isRevoked).toBe(true);
        expect(refreshTokenRepo.update).toHaveBeenCalledWith(activeToken);
    });
});
