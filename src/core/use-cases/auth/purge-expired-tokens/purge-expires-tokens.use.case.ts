import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";

/**
 * Use case for purging expired refresh tokens from the system.
 *
 * This use case is responsible for cleaning up expired refresh tokens from the database.
 * It's typically used as part of a scheduled cleanup process to maintain system performance
 * and security by removing tokens that are no longer valid.
 */
export class PurgeExpiredTokensUseCase {
    /**
     * Creates a new instance of PurgeExpiredTokensUseCase.
     *
     * @param refreshTokenRepository - Repository for managing refresh token operations
     */
    constructor(
        private readonly refreshTokenRepository: IRefreshTokenRepository,
    ) {}

    /**
     * Executes the purge operation to remove all expired refresh tokens.
     *
     * @returns Promise<number> The number of expired tokens that were deleted
     *
     * @throws Will throw an error if the database operation fails
     */
    async execute(): Promise<number> {
        return this.refreshTokenRepository.deleteExpiredTokens();
    }
}
