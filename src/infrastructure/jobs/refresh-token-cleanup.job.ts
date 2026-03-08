import type { CleanupRefreshTokensUseCase } from "@core/use-cases/cleanup-refresh-tokens.usecase.ts";

export interface RefreshTokenCleanupJobInput {
    gracePeriodHours: number;
}

export class RefreshTokenCleanupJob {
    constructor(
        private readonly cleanupRefreshTokensUseCase: CleanupRefreshTokensUseCase,
    ) {}

    async run(input: RefreshTokenCleanupJobInput): Promise<number> {
        return this.cleanupRefreshTokensUseCase.execute({
            gracePeriodHours: input.gracePeriodHours,
        });
    }
}
