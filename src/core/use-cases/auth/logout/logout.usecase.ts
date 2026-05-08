import type { AuthTokenPort } from "@core/ports/services/auth-token.port";
import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";
import type { LogoutInput } from "./logout.input";

/**
 * Use case for handling user logout and token revocation.
 *
 * This use case manages the logout process by revoking refresh tokens
 * to prevent further access to protected resources.
 */
export class LogoutUseCase {
    /**
     * Creates a new instance of LogoutUseCase.
     *
     * @param refreshTokenRepository - Repository for refresh token operations
     * @param authTokenService - Service for token operations
     */
    constructor(
        private readonly refreshTokenRepository: IRefreshTokenRepository,
        private readonly authTokenService: AuthTokenPort,
    ) {}

    /**
     * Executes the logout process by revoking the provided refresh token.
     *
     * @param input - Logout input containing the refresh token to revoke
     * @returns Promise<void> - Resolves when logout is complete
     *
     * @remarks
     * If no token is provided, the method returns silently.
     * If the token is not found or already revoked, the method returns silently.
     */
    async execute(input: LogoutInput): Promise<void> {
        if (!input.token) {
            return;
        }

        const tokenHash = this.authTokenService.hashRefreshSecret(input.token);
        const currentToken =
            await this.refreshTokenRepository.findByTokenHash(tokenHash);

        if (currentToken && !currentToken.isRevoked) {
            currentToken.revoke();
            await this.refreshTokenRepository.update(currentToken);
        }
    }
}
