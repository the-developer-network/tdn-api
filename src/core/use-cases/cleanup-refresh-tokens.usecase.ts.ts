import type { PrismaRefreshTokenRepository } from "@infrastructure/repositories/prisma-refresh-token.repository";

export interface CleanupRefreshTokensUseCaseInput {
    gracePeriodHours: number;
}

export class CleanupRefreshTokensUseCase {
    constructor(
        private readonly refreshTokenRepository: PrismaRefreshTokenRepository,
    ) {}

    async execute(input: CleanupRefreshTokensUseCaseInput): Promise<number> {
        const thresholdDate = new Date(
            Date.now() - input.gracePeriodHours * 60 * 60 * 1000,
        );

        return this.refreshTokenRepository.deleteInvalidBefore(thresholdDate);
    }
}
