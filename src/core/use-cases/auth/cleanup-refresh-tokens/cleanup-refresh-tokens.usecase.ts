import type { IRefreshTokenRepository } from "@core/ports/repositories/refresh-token.repository";
import type { CleanupRefreshTokensUseCaseInput } from "./cleanup-refresh-tokens-usecase.input";

export class CleanupRefreshTokensUseCase {
    constructor(
        private readonly refreshTokenRepository: IRefreshTokenRepository,
    ) {}

    async execute(input: CleanupRefreshTokensUseCaseInput): Promise<number> {
        const thresholdDate = new Date(
            Date.now() - input.gracePeriodHours * 60 * 60 * 1000,
        );

        return this.refreshTokenRepository.deleteInvalidBefore(thresholdDate);
    }
}
