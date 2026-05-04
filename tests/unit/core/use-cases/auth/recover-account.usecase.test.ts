import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecoverAccountUseCase } from "@core/use-cases/auth/recover-account/recover-account.usecase";
import { UnauthorizedError } from "@core/errors";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type {
    AuthTokenPort,
    RecoveryPayload,
} from "@core/ports/services/auth-token.port";
import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";
import { buildUser } from "../../../helpers/mock-factories";

describe("RecoverAccountUseCase", () => {
    let useCase: RecoverAccountUseCase;
    let userRepo: Pick<IUserRepository, "findById" | "restoreById">;
    let authTokenSvc: Pick<
        AuthTokenPort,
        "verifyRecoveryToken" | "generate" | "hashRefreshSecret"
    >;
    let refreshTokenRepo: Pick<IRefreshTokenRepository, "create">;

    const input = {
        recoveryToken: "valid_recovery_token",
        deviceIp: "127.0.0.1",
        userAgent: "Mozilla/5.0",
    };

    const validPayload: RecoveryPayload = {
        sub: "user-1",
        purpose: "account_recovery",
    };

    beforeEach(() => {
        userRepo = {
            findById: vi.fn(),
            restoreById: vi.fn(),
        };
        authTokenSvc = {
            verifyRecoveryToken: vi.fn(),
            generate: vi.fn(),
            hashRefreshSecret: vi.fn(),
        };
        refreshTokenRepo = { create: vi.fn() };
        useCase = new RecoverAccountUseCase(
            userRepo as IUserRepository,
            refreshTokenRepo as IRefreshTokenRepository,
            authTokenSvc as AuthTokenPort,
        );
    });

    it("should throw UnauthorizedError when recovery token is invalid", async () => {
        vi.mocked(authTokenSvc.verifyRecoveryToken).mockImplementation(() => {
            throw new Error("jwt malformed");
        });

        await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError when token purpose is not account_recovery", async () => {
        vi.mocked(authTokenSvc.verifyRecoveryToken).mockReturnValue({
            sub: "user-1",
            purpose: "other_purpose" as RecoveryPayload["purpose"],
        });

        await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError when user is not found", async () => {
        vi.mocked(authTokenSvc.verifyRecoveryToken).mockReturnValue(
            validPayload,
        );
        vi.mocked(userRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError when user is not deleted (already active)", async () => {
        const activeUser = buildUser({ deletedAt: null });
        vi.mocked(authTokenSvc.verifyRecoveryToken).mockReturnValue(
            validPayload,
        );
        vi.mocked(userRepo.findById).mockResolvedValue(activeUser);

        await expect(useCase.execute(input)).rejects.toThrow(UnauthorizedError);
    });

    it("should restore user and return tokens on valid recovery", async () => {
        const deletedUser = buildUser({ deletedAt: new Date() });
        vi.mocked(authTokenSvc.verifyRecoveryToken).mockReturnValue(
            validPayload,
        );
        vi.mocked(userRepo.findById).mockResolvedValue(deletedUser);
        vi.mocked(userRepo.restoreById).mockResolvedValue();
        vi.mocked(authTokenSvc.generate).mockReturnValue({
            accessToken: "access_token",
            refreshToken: "refresh_token",
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
            refreshTokenExpiresAt:
                Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        });
        vi.mocked(authTokenSvc.hashRefreshSecret).mockReturnValue(
            "hashed_secret",
        );
        vi.mocked(refreshTokenRepo.create).mockResolvedValue(
            undefined as never,
        );

        const result = await useCase.execute(input);

        expect(userRepo.restoreById).toHaveBeenCalledWith(deletedUser.id);
        expect(refreshTokenRepo.create).toHaveBeenCalledOnce();
        expect(result.tokens.accessToken).toBe("access_token");
        expect(result.tokens.refreshToken).toBe("refresh_token");
        expect(result.user.id).toBe(deletedUser.id);
    });

    it("should store refresh token with correct device info", async () => {
        const deletedUser = buildUser({ deletedAt: new Date() });
        vi.mocked(authTokenSvc.verifyRecoveryToken).mockReturnValue(
            validPayload,
        );
        vi.mocked(userRepo.findById).mockResolvedValue(deletedUser);
        vi.mocked(userRepo.restoreById).mockResolvedValue();
        vi.mocked(authTokenSvc.generate).mockReturnValue({
            accessToken: "access_token",
            refreshToken: "refresh_token",
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
            refreshTokenExpiresAt:
                Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        });
        vi.mocked(authTokenSvc.hashRefreshSecret).mockReturnValue(
            "hashed_secret",
        );
        vi.mocked(refreshTokenRepo.create).mockResolvedValue(
            undefined as never,
        );

        await useCase.execute(input);

        expect(refreshTokenRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                deviceIp: input.deviceIp,
                userAgent: input.userAgent,
                userId: deletedUser.id,
                tokenHash: "hashed_secret",
            }),
        );
    });
});
