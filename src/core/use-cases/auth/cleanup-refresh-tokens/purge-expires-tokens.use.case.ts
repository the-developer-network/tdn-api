import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";

export class PurgeExpiredTokensUseCase {
    constructor(
        private readonly refreshTokenRepository: IRefreshTokenRepository,
    ) {}

    async execute(): Promise<number> {
        return this.refreshTokenRepository.deleteExpiredTokens();
    }
}
