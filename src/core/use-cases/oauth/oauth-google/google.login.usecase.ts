import type { LoginOutput } from "@core/use-cases/auth/login/login.output";
import type { GoogleAuthPort } from "@core/ports/services/google-auth.port";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type {
    AuthTokenPort,
    UserPayload,
} from "@core/ports/services/auth-token.port";
import { AccountPendingDeletionError } from "@core/errors/account-pending-deletion.error";
import type { CryptoPort } from "@core/ports/services/crypto.port";
import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";
import type { GoogleLoginInput } from "./google-login.input";

export class GoogleLoginUseCase {
    constructor(
        private readonly googleAuthService: GoogleAuthPort,
        private readonly userRepository: IUserRepository,
        private readonly authTokenService: AuthTokenPort,
        private readonly cryptoService: CryptoPort,
        private readonly refreshTokenRepository: IRefreshTokenRepository,
    ) {}

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
            accessToken,
            expiresAt,
            refreshToken,
            refreshTokenExpiresAt,
            user: payload,
        };
    }
}
