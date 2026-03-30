import type { LoginOutput } from "@core/use-cases/auth/login/login.output";
import type { GoogleAuthPort } from "@core/ports/services/google-auth.port";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type {
    AuthTokenPort,
    UserPayload,
} from "@core/ports/services/auth-token.port";
import { AccountPendingDeletionError } from "@core/errors";
import type { CryptoPort } from "@core/ports/services/crypto.port";
import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";
import type { GoogleLoginInput } from "./google-login.input";
import { AuthMapper } from "../../auth/auth.mapper";

/**
 * Use case for handling Google OAuth authentication.
 *
 * This use case manages the complete Google OAuth login process including
 * user creation, token generation, and refresh token management.
 */
export class GoogleLoginUseCase {
    /**
     * Creates a new instance of GoogleLoginUseCase.
     *
     * @param googleAuthService - Service for Google OAuth operations
     * @param userRepository - Repository for managing user data
     * @param authTokenService - Service for generating authentication tokens
     * @param cryptoService - Service for cryptographic operations
     * @param refreshTokenRepository - Repository for managing refresh tokens
     */
    constructor(
        private readonly googleAuthService: GoogleAuthPort,
        private readonly userRepository: IUserRepository,
        private readonly authTokenService: AuthTokenPort,
        private readonly cryptoService: CryptoPort,
        private readonly refreshTokenRepository: IRefreshTokenRepository,
    ) {}

    /**
     * Executes the Google OAuth login process.
     *
     * @param input - Google login input containing OAuth code and device info
     * @returns Promise<LoginOutput> Authentication tokens and user information
     *
     * @throws AccountPendingDeletionError - When account is pending deletion
     *
     * @remarks
     * This method handles both new user creation and existing user login.
     * For new users, it creates an account with a unique username and stores
     * the OAuth provider information. For existing users, it validates their
     * account status and generates new authentication tokens.
     */
    async execute(input: GoogleLoginInput): Promise<LoginOutput> {
        const profile = await this.googleAuthService.getUserProfileByCode(
            input.code,
        );

        let user = await this.userRepository.findByEmail(profile.email);

        if (user) {
            if (user.isDeleted()) {
                const recoveryToken =
                    this.authTokenService.generateRecoveryToken(user.id);

                throw new AccountPendingDeletionError(recoveryToken);
            }
        } else {
            let finalUsername = profile.username;
            const isUsernameTaken =
                await this.userRepository.findByUsername(finalUsername);

            if (isUsernameTaken) {
                const randomSuffix = this.cryptoService.generateRandomHex(2);
                finalUsername = `${finalUsername}_${randomSuffix}`;
            }

            user = await this.userRepository.createWithOAuth({
                email: profile.email,
                username: finalUsername,
                provider: "google",
                providerAccountId: profile.providerAccountId,
                isEmailVerified: true,
            });
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
                ...AuthMapper.toUserOutput(payload),
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
