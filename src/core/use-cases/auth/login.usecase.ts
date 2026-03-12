import {
    InvalidCredentialsError,
    AccountPendingDeletionError,
} from "@core/errors/";
import type { PasswordPort } from "@core/ports/password.port";
import type { AuthTokenPort, UserPayload } from "@core/ports/auth-token.port";
import type { IRefreshTokenRepository } from "@core/repositories/refresh-token.repository";
import type { IUserRepository } from "@core/repositories/user.repository";

export interface LoginInput {
    identifier: string;
    password: string;
    userAgent: string;
    deviceIp: string;
}

export interface LoginOutput {
    accessToken: string;
    expiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    user: UserPayload;
}

export class LoginUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordService: PasswordPort,
        private readonly authTokenService: AuthTokenPort,
        private readonly refreshTokenRepository: IRefreshTokenRepository,
    ) {}

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
            accessToken,
            expiresAt,
            refreshToken,
            refreshTokenExpiresAt,
            user: payload,
        };
    }
}
