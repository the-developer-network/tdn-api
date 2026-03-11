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
    LogoutUseCase,
    type LogoutInput,
} from "@core/use-cases/auth/logout.usecase";
import type { AuthTokenPort } from "@core/ports/auth-token.port";
import type {
    TransactionPort,
    TransactionContext,
} from "@core/ports/transaction.port";
import type { IRefreshTokenRepository } from "@core/repositories/refresh-token.repository";

describe("Logout Use Case", () => {
    let logoutUseCase: LogoutUseCase;
    let mockTransactionPort: Mocked<TransactionPort>;
    let mockTokenService: Mocked<AuthTokenPort>;
    let mockRefreshTokenRepository: Mocked<IRefreshTokenRepository>;
    let mockContext: TransactionContext;

    beforeEach(() => {
        mockRefreshTokenRepository = {
            create: vi.fn(),
            findByTokenHash: vi.fn(),
            update: vi.fn(),
            deleteInvalidBefore: vi.fn(),
            revokeAllByUserId: vi.fn(),
        } as unknown as Mocked<IRefreshTokenRepository>;

        mockContext = {
            refreshTokenRepository: mockRefreshTokenRepository,
            userRepository: {} as any,
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

        logoutUseCase = new LogoutUseCase(
            mockTransactionPort,
            mockTokenService,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should return early without doing anything if token is not provided.", async () => {
            /** Arrange */
            const input: LogoutInput = { token: "" };

            /** Act */
            await logoutUseCase.execute(input);

            /** Assert */
            expect(mockTransactionPort.runInTransaction).not.toHaveBeenCalled();
            expect(mockTokenService.hashRefreshSecret).not.toHaveBeenCalled();
        });

        it("Should hash the token, find it, revoke it, and update the repository if it is valid.", async () => {
            /** Arrange */
            const input: LogoutInput = { token: "raw_refresh_token" };
            const hashedToken = "hashed_refresh_token_string";

            const mockCurrentToken = {
                isRevoked: false,
                revoke: vi.fn(),
            };

            mockTokenService.hashRefreshSecret.mockReturnValue(hashedToken);
            mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(
                mockCurrentToken as any,
            );

            /** Act */
            await logoutUseCase.execute(input);

            /** Assert */
            expect(mockTransactionPort.runInTransaction).toHaveBeenCalledTimes(
                1,
            );
            expect(mockTokenService.hashRefreshSecret).toHaveBeenCalledWith(
                input.token,
            );

            expect(
                mockRefreshTokenRepository.findByTokenHash,
            ).toHaveBeenCalledWith(hashedToken);
            expect(mockCurrentToken.revoke).toHaveBeenCalledTimes(1);
            expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
                mockCurrentToken,
            );
        });

        it("Should not revoke or update if the token is already revoked.", async () => {
            /** Arrange */
            const input: LogoutInput = { token: "raw_refresh_token" };
            const hashedToken = "hashed_refresh_token_string";

            const mockCurrentToken = {
                isRevoked: true,
                revoke: vi.fn(),
            };

            mockTokenService.hashRefreshSecret.mockReturnValue(hashedToken);
            mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(
                mockCurrentToken as any,
            );

            /** Act */
            await logoutUseCase.execute(input);

            /** Assert */
            expect(
                mockRefreshTokenRepository.findByTokenHash,
            ).toHaveBeenCalledWith(hashedToken);

            expect(mockCurrentToken.revoke).not.toHaveBeenCalled();
            expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled();
        });

        it("Should not revoke or update if the token is not found in the database.", async () => {
            /** Arrange */
            const input: LogoutInput = { token: "non_existent_token" };

            mockTokenService.hashRefreshSecret.mockReturnValue("some_hash");
            mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(null);

            /** Act */
            await logoutUseCase.execute(input);

            /** Assert */
            expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled();
        });
    });
});
