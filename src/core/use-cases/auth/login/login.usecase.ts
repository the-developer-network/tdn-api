import {
    InvalidCredentialsError,
    AccountPendingDeletionError,
} from "@core/errors";
import type { PasswordPort } from "@core/ports/services/password.port";
import type {
    AuthTokenPort,
    UserPayload,
} from "@core/ports/services/auth-token.port";
import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { LoginInput } from "./login.input";
import type { LoginOutput } from "./login.output";
import { AuthMapper } from "../auth.mapper";

/**
 * Use case for handling user authentication and login.
 *
 * This use case manages the complete login process including credential validation,
 * token generation, and refresh token management.
 */
export class LoginUseCase {
    /**
     * Creates a new instance of LoginUseCase.
     *
     * @param userRepository - Repository for managing user data
     * @param passwordService - Service for password hashing and verification
     * @param authTokenService - Service for generating authentication tokens
     * @param refreshTokenRepository - Repository for managing refresh tokens
     */
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordService: PasswordPort,
        private readonly authTokenService: AuthTokenPort,
        private readonly refreshTokenRepository: IRefreshTokenRepository,
    ) {}

    /**
     * Executes the login process for a user.
     *
     * @param input - Login credentials and device information
     * @returns Promise<LoginOutput> Authentication tokens and user information
     *
     * @throws InvalidCredentialsError - When credentials are invalid
     * @throws AccountPendingDeletionError - When account is pending deletion
     *
     * @remarks
     * This method validates user credentials, generates access and refresh tokens,
     * and stores the refresh token in the database for future use.
     */
    async execute(input: LoginInput): Promise<LoginOutput> {
        const user = await this.userRepository.findByIdentifier(
            input.identifier,
        );

        if (!user || !user.hasPassword()) {
            throw new InvalidCredentialsError();
        }

        const isPasswordValid = await this.passwordService.verify(
            input.password,
            user.passwordHash!,
        );

        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }

        if (user.isDeleted()) {
            const recoveryToken = this.authTokenService.generateRecoveryToken(
                user.id,
            );

            throw new AccountPendingDeletionError(recoveryToken);
        }

        const payload: UserPayload = {
            id: user.id,
            username: user.username,
        };

        const { accessToken, expiresAt, refreshToken, refreshTokenExpiresAt } =
            this.authTokenService.generate(payload);

        const refreshTokenHash =
            this.authTokenService.hashRefreshSecret(refreshToken);

        await this.refreshTokenRepository.create({
            tokenHash: refreshTokenHash,
            userId: user.id,
            deviceIp: input.deviceIp,
            userAgent: input.userAgent,
            expiresAt: refreshTokenExpiresAt,
        });

        return {
            user: {
                id: payload.id,
                username: payload.username,
                isEmailVerified: user.isEmailVerified,
            },
            tokens: AuthMapper.toTokenOutput({
                accessToken,
                expiresAt,
                refreshToken,
                refreshTokenExpiresAt,
            }),
        };
    }
}
