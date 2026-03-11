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
    LoginUseCase,
    type LoginInput,
} from "@core/use-cases/auth/login.usecase";
import { InvalidCredentialsError } from "@core/errors/invalid-credentials.error";
import type { IUserRepository } from "@core/repositories/user.repository";
import type { IRefreshTokenRepository } from "@core/repositories/refresh-token.repository";
import type { PasswordPort } from "@core/ports/password.port";
import type { AuthTokenPort, TokenResult } from "@core/ports/auth-token.port";

describe("Login Use Case", () => {
    let loginUseCase: LoginUseCase;
    let mockUserRepository: Mocked<IUserRepository>;
    let mockPasswordService: Mocked<PasswordPort>;
    let mockTokenService: Mocked<AuthTokenPort>;
    let mockRefreshTokenRepository: Mocked<IRefreshTokenRepository>;

    let mockUser: any;
    let validRequest: LoginInput;

    beforeEach(() => {
        mockUserRepository = {
            create: vi.fn(),
            findByIdentifier: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            findByEmail: vi.fn(),
        } as unknown as Mocked<IUserRepository>;

        mockPasswordService = {
            hash: vi.fn(),
            verify: vi.fn(),
        };

        mockTokenService = {
            generate: vi.fn(),
            verify: vi.fn(),
            hashRefreshSecret: vi.fn(),
        };

        mockRefreshTokenRepository = {
            create: vi.fn(),
            findByTokenHash: vi.fn(),
            update: vi.fn(),
            deleteInvalidBefore: vi.fn(),
            revokeAllByUserId: vi.fn(),
        } as unknown as Mocked<IRefreshTokenRepository>;

        loginUseCase = new LoginUseCase(
            mockUserRepository,
            mockPasswordService,
            mockTokenService,
            mockRefreshTokenRepository,
        );

        validRequest = {
            identifier: "test@example.com",
            password: "SecurePassword123!",
            userAgent: "Mozilla/5.0",
            deviceIp: "192.168.1.1",
        };

        mockUser = {
            id: "user-123",
            username: "testuser",
            passwordHash: "hashed_string",
            isDeleted: vi.fn().mockReturnValue(false),
            hasPassword: vi.fn().mockReturnValue(true),
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should successfully authenticate a user and return tokens.", async () => {
            /** Arrange */
            const mockTokenResult: TokenResult = {
                accessToken: "access.jwt.token",
                expiresAt: 1234567890,
                refreshToken: "raw_refresh_token",
                refreshTokenExpiresAt: new Date("2026-04-10T12:00:00Z"),
            };
            const hashedRefreshToken = "hashed_refresh_token_string";

            mockUserRepository.findByIdentifier.mockResolvedValue(mockUser);
            mockPasswordService.verify.mockResolvedValue(true);
            mockTokenService.generate.mockReturnValue(mockTokenResult);
            mockTokenService.hashRefreshSecret.mockReturnValue(
                hashedRefreshToken,
            );
            mockRefreshTokenRepository.create.mockResolvedValue({} as any);

            /** Act */
            const result = await loginUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.findByIdentifier).toHaveBeenCalledWith(
                validRequest.identifier,
            );
            expect(mockUserRepository.findByIdentifier).toHaveBeenCalledTimes(
                1,
            );

            expect(mockUser.isDeleted).toHaveBeenCalledTimes(1);
            expect(mockUser.hasPassword).toHaveBeenCalledTimes(1);

            expect(mockPasswordService.verify).toHaveBeenCalledWith(
                validRequest.password,
                mockUser.passwordHash,
            );
            expect(mockPasswordService.verify).toHaveBeenCalledTimes(1);

            expect(mockTokenService.generate).toHaveBeenCalledWith({
                id: mockUser.id,
                username: mockUser.username,
            });

            expect(mockTokenService.hashRefreshSecret).toHaveBeenCalledWith(
                mockTokenResult.refreshToken,
            );

            expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith({
                tokenHash: hashedRefreshToken,
                userId: mockUser.id,
                deviceIp: validRequest.deviceIp,
                userAgent: validRequest.userAgent,
                expiresAt: mockTokenResult.refreshTokenExpiresAt,
            });

            expect(result).toEqual({
                ...mockTokenResult,
                user: {
                    id: mockUser.id,
                    username: mockUser.username,
                },
            });
        });

        it("Should throw InvalidCredentialsError if user is not found.", async () => {
            /** Arrange */
            mockUserRepository.findByIdentifier.mockResolvedValue(null);

            /** Act & Assert */
            await expect(loginUseCase.execute(validRequest)).rejects.toThrow(
                InvalidCredentialsError,
            );
            expect(mockPasswordService.verify).not.toHaveBeenCalled();
        });

        it("Should throw InvalidCredentialsError if user is marked as deleted.", async () => {
            /** Arrange */
            mockUser.isDeleted.mockReturnValue(true);
            mockUserRepository.findByIdentifier.mockResolvedValue(mockUser);

            /** Act & Assert */
            await expect(loginUseCase.execute(validRequest)).rejects.toThrow(
                InvalidCredentialsError,
            );
            expect(mockPasswordService.verify).not.toHaveBeenCalled();
        });

        it("Should throw InvalidCredentialsError if user does not have a password (e.g., OAuth only).", async () => {
            /** Arrange */
            mockUser.hasPassword.mockReturnValue(false);
            mockUserRepository.findByIdentifier.mockResolvedValue(mockUser);

            /** Act & Assert */
            await expect(loginUseCase.execute(validRequest)).rejects.toThrow(
                InvalidCredentialsError,
            );
            expect(mockPasswordService.verify).not.toHaveBeenCalled();
        });

        it("Should throw InvalidCredentialsError if the password does not match.", async () => {
            /** Arrange */
            mockUserRepository.findByIdentifier.mockResolvedValue(mockUser);
            mockPasswordService.verify.mockResolvedValue(false);

            /** Act & Assert */
            await expect(loginUseCase.execute(validRequest)).rejects.toThrow(
                InvalidCredentialsError,
            );
            expect(mockTokenService.generate).not.toHaveBeenCalled();
        });
    });
});
