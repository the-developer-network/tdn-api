import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mocked,
} from "vitest";
import {
    RefreshUseCase,
    type RefreshInput,
} from "@core/use-cases/auth/refresh.usecase";
import { UnauthorizedError } from "@core/errors/unauthorized.error";
import type { AuthTokenPort, TokenResult } from "@core/ports/auth-token.port";
import type {
    TransactionPort,
    TransactionContext,
} from "@core/ports/transaction.port";
import type { IRefreshTokenRepository } from "@core/repositories/refresh-token.repository";
import type { IUserRepository } from "@core/repositories/user.repository";

describe("Refresh Use Case", () => {
    let refreshUseCase: RefreshUseCase;
    let mockTransactionPort: Mocked<TransactionPort>;
    let mockTokenService: Mocked<AuthTokenPort>;
    let mockRefreshTokenRepository: Mocked<IRefreshTokenRepository>;
    let mockUserRepository: Mocked<IUserRepository>;
    let mockContext: TransactionContext;

    let validRequest: RefreshInput;
    let mockCurrentToken: any;
    let mockUser: any;

    beforeEach(() => {
        mockRefreshTokenRepository = {
            create: vi.fn(),
            findByTokenHash: vi.fn(),
            update: vi.fn(),
            deleteInvalidBefore: vi.fn(),
            revokeAllByUserId: vi.fn(),
        } as unknown as Mocked<IRefreshTokenRepository>;

        mockUserRepository = {
            create: vi.fn(),
            findByIdentifier: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            findByEmail: vi.fn(),
        } as unknown as Mocked<IUserRepository>;

        mockContext = {
            refreshTokenRepository: mockRefreshTokenRepository,
            userRepository: mockUserRepository,
        };

        mockTransactionPort = {
            runInTransaction: vi.fn().mockImplementation(async (work) => {
                return await work(mockContext);
            }),
        };

        mockTokenService = {
            generate: vi.fn(),
            verify: vi.fn(),
            hashRefreshSecret: vi.fn(),
        };

        refreshUseCase = new RefreshUseCase(
            mockTransactionPort,
            mockTokenService,
        );

        validRequest = {
            token: "raw_incoming_refresh_token",
            deviceIp: "192.168.1.1",
            userAgent: "Mozilla/5.0",
        };

        mockCurrentToken = {
            userId: "user-123",
            isRevoked: false,
            isExpired: vi.fn().mockReturnValue(false),
            revoke: vi.fn(),
        };

        mockUser = {
            id: "user-123",
            username: "testuser",
            isDeleted: vi.fn().mockReturnValue(false),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should successfully rotate the refresh token and return new credentials.", async () => {
            /** Arrange */
            const incomingHash = "hashed_incoming_token";
            const newHash = "hashed_new_token";
            const mockTokenResult: TokenResult = {
                accessToken: "new_access_token",
                expiresAt: 1234567890,
                refreshToken: "new_refresh_token",
                refreshTokenExpiresAt: new Date("2026-04-10T12:00:00Z"),
            };

            // Setup token service behavior for incoming vs outgoing hashes
            mockTokenService.hashRefreshSecret
                .mockReturnValueOnce(incomingHash) // First call: hashing incoming token
                .mockReturnValueOnce(newHash); // Second call: hashing newly generated token

            mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(
                mockCurrentToken,
            );
            mockUserRepository.findById.mockResolvedValue(mockUser);
            mockTokenService.generate.mockReturnValue(mockTokenResult);

            /** Act */
            const result = await refreshUseCase.execute(validRequest);

            /** Assert */
            expect(mockTokenService.hashRefreshSecret).toHaveBeenNthCalledWith(
                1,
                validRequest.token,
            );
            expect(
                mockRefreshTokenRepository.findByTokenHash,
            ).toHaveBeenCalledWith(incomingHash);

            expect(mockUserRepository.findById).toHaveBeenCalledWith(
                mockCurrentToken.userId,
            );

            // Should revoke the old token
            expect(mockCurrentToken.revoke).toHaveBeenCalledTimes(1);
            expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
                mockCurrentToken,
            );

            // Should generate new token
            expect(mockTokenService.generate).toHaveBeenCalledWith({
                id: mockUser.id,
                username: mockUser.username,
            });

            // Should hash the new token and save to DB
            expect(mockTokenService.hashRefreshSecret).toHaveBeenNthCalledWith(
                2,
                mockTokenResult.refreshToken,
            );
            expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith({
                tokenHash: newHash,
                userId: mockUser.id,
                deviceIp: validRequest.deviceIp,
                userAgent: validRequest.userAgent,
                expiresAt: mockTokenResult.refreshTokenExpiresAt,
            });

            // Output should match expected structure
            expect(result).toEqual({
                ...mockTokenResult,
                user: {
                    id: mockUser.id,
                    username: mockUser.username,
                },
            });
        });

        it("Should throw UnauthorizedError if the session is not found in the database.", async () => {
            /** Arrange */
            mockTokenService.hashRefreshSecret.mockReturnValue(
                "hashed_incoming_token",
            );
            mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(null);

            /** Act & Assert */
            await expect(
                refreshUseCase.execute(validRequest),
            ).rejects.toThrowError(new UnauthorizedError("Session not found"));
            expect(mockUserRepository.findById).not.toHaveBeenCalled();
        });

        it("Should trigger SECURITY ALERT and revoke all sessions if token reuse is detected.", async () => {
            /** Arrange */
            mockCurrentToken.isRevoked = true; // Simulating a compromised token

            mockTokenService.hashRefreshSecret.mockReturnValue(
                "hashed_incoming_token",
            );
            mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(
                mockCurrentToken,
            );

            /** Act & Assert */
            await expect(
                refreshUseCase.execute(validRequest),
            ).rejects.toThrowError(
                new UnauthorizedError(
                    "Security alert: Session compromised. All sessions revoked.",
                ),
            );

            // Critical security assertion
            expect(
                mockRefreshTokenRepository.revokeAllByUserId,
            ).toHaveBeenCalledWith(mockCurrentToken.userId);
            expect(mockCurrentToken.isExpired).not.toHaveBeenCalled();
        });

        it("Should throw UnauthorizedError if the token is expired.", async () => {
            /** Arrange */
            mockCurrentToken.isExpired.mockReturnValue(true);

            mockTokenService.hashRefreshSecret.mockReturnValue(
                "hashed_incoming_token",
            );
            mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(
                mockCurrentToken,
            );

            /** Act & Assert */
            await expect(
                refreshUseCase.execute(validRequest),
            ).rejects.toThrowError(new UnauthorizedError("Session expired"));
            expect(mockUserRepository.findById).not.toHaveBeenCalled();
        });

        it("Should throw UnauthorizedError if the associated user is not found.", async () => {
            /** Arrange */
            mockTokenService.hashRefreshSecret.mockReturnValue(
                "hashed_incoming_token",
            );
            mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(
                mockCurrentToken,
            );
            mockUserRepository.findById.mockResolvedValue(null);

            /** Act & Assert */
            await expect(
                refreshUseCase.execute(validRequest),
            ).rejects.toThrowError(
                new UnauthorizedError("User account unavailable"),
            );
            expect(mockCurrentToken.revoke).not.toHaveBeenCalled();
        });

        it("Should throw UnauthorizedError if the associated user is marked as deleted.", async () => {
            /** Arrange */
            mockUser.isDeleted.mockReturnValue(true);

            mockTokenService.hashRefreshSecret.mockReturnValue(
                "hashed_incoming_token",
            );
            mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(
                mockCurrentToken,
            );
            mockUserRepository.findById.mockResolvedValue(mockUser);

            /** Act & Assert */
            await expect(
                refreshUseCase.execute(validRequest),
            ).rejects.toThrowError(
                new UnauthorizedError("User account unavailable"),
            );
            expect(mockCurrentToken.revoke).not.toHaveBeenCalled();
        });
    });
});
