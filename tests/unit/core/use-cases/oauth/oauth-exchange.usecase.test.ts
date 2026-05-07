import { beforeEach, describe, expect, it, vi } from "vitest";
import { OAuthExchangeUseCase } from "@core/use-cases/oauth/oauth-exchange";
import type { CachePort } from "@core/ports/services/cache.port";
import type { AuthTokenPort } from "@core/ports/services/auth-token.port";
import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";
import { UnauthorizedError } from "@core/errors";
import { buildRefreshToken } from "../../../helpers/mock-factories";

const mockPayload = {
    userId: "user-1",
    username: "testuser",
    isEmailVerified: true,
};

const mockTokenResult = {
    accessToken: "access-token",
    expiresAt: 9999999999,
    refreshToken: "refresh-token",
    refreshTokenExpiresAt: 9999999999,
};

describe("OAuthExchangeUseCase", () => {
    let useCase: OAuthExchangeUseCase;
    let cacheService: Pick<CachePort, "get" | "delete">;
    let authTokenService: Pick<AuthTokenPort, "generate" | "hashRefreshSecret">;
    let refreshTokenRepository: Pick<IRefreshTokenRepository, "create">;

    beforeEach(() => {
        cacheService = {
            get: vi.fn(),
            delete: vi.fn().mockResolvedValue(undefined),
        };
        authTokenService = {
            generate: vi.fn().mockReturnValue(mockTokenResult),
            hashRefreshSecret: vi.fn().mockReturnValue("hashed-refresh-token"),
        };
        refreshTokenRepository = {
            create: vi.fn().mockResolvedValue(buildRefreshToken()),
        };
        useCase = new OAuthExchangeUseCase(
            cacheService as CachePort,
            authTokenService as AuthTokenPort,
            refreshTokenRepository as IRefreshTokenRepository,
        );
    });

    it("should throw UnauthorizedError when code is not found in cache", async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);

        await expect(
            useCase.execute({
                code: "invalid-code",
                deviceIp: "127.0.0.1",
                userAgent: "Mozilla/5.0",
            }),
        ).rejects.toThrow(UnauthorizedError);
    });

    it("should delete cache key immediately after reading (single-use)", async () => {
        vi.mocked(cacheService.get).mockResolvedValue(
            JSON.stringify(mockPayload),
        );

        await useCase.execute({
            code: "valid-code",
            deviceIp: "127.0.0.1",
            userAgent: "Mozilla/5.0",
        });

        expect(cacheService.delete).toHaveBeenCalledOnce();
        expect(cacheService.delete).toHaveBeenCalledWith(
            "oauth:exchange:valid-code",
        );
    });

    it("should create refresh token with correct data from input and payload", async () => {
        vi.mocked(cacheService.get).mockResolvedValue(
            JSON.stringify(mockPayload),
        );

        await useCase.execute({
            code: "valid-code",
            deviceIp: "10.0.0.1",
            userAgent: "TestAgent/1.0",
        });

        expect(refreshTokenRepository.create).toHaveBeenCalledOnce();
        expect(refreshTokenRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                tokenHash: "hashed-refresh-token",
                userId: "user-1",
                deviceIp: "10.0.0.1",
                userAgent: "TestAgent/1.0",
            }),
        );
    });

    it("should return correct LoginOutput with user and token data", async () => {
        vi.mocked(cacheService.get).mockResolvedValue(
            JSON.stringify(mockPayload),
        );

        const result = await useCase.execute({
            code: "valid-code",
            deviceIp: "127.0.0.1",
            userAgent: "Mozilla/5.0",
        });

        expect(result.user).toEqual({
            id: "user-1",
            username: "testuser",
            isEmailVerified: true,
        });
        expect(result.tokens).toEqual({
            accessToken: "access-token",
            expiresAt: 9999999999,
            refreshToken: "refresh-token",
            refreshTokenExpiresAt: 9999999999,
        });
    });

    it("should propagate repository errors when creating refresh token", async () => {
        vi.mocked(cacheService.get).mockResolvedValue(
            JSON.stringify(mockPayload),
        );
        vi.mocked(refreshTokenRepository.create).mockRejectedValue(
            new Error("Database error"),
        );

        await expect(
            useCase.execute({
                code: "valid-code",
                deviceIp: "127.0.0.1",
                userAgent: "Mozilla/5.0",
            }),
        ).rejects.toThrow("Database error");
    });
});
