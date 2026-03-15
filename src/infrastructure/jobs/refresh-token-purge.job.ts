import type { PurgeExpiredTokensUseCase } from "@core/use-cases/auth/cleanup-refresh-tokens/purge-expires-tokens.use.case";

export class RefreshTokenPurgeJob {
    constructor(
        private readonly purgeExpiredTokensUseCase: PurgeExpiredTokensUseCase,
    ) {}

    async run(): Promise<number> {
        return await this.purgeExpiredTokensUseCase.execute();
    }
}
