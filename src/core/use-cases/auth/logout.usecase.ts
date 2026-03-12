import type { AuthTokenPort } from "@core/ports/auth-token.port";
import type { TransactionPort } from "@core/ports/transaction.port";

export interface LogoutInput {
    token: string;
}

export class LogoutUseCase {
    constructor(
        private readonly transactionService: TransactionPort,
        private readonly authTokenService: AuthTokenPort,
    ) {}

    async execute(input: LogoutInput): Promise<void> {
        if (!input.token) {
            return;
        }

        await this.transactionService.runInTransaction(async (ctx) => {
            const tokenHash = this.authTokenService.hashRefreshSecret(
                input.token,
            );

            const currentToken =
                await ctx.refreshTokenRepository.findByTokenHash(tokenHash);

            if (currentToken && !currentToken.isRevoked) {
                currentToken.revoke();

                await ctx.refreshTokenRepository.update(currentToken);
            }
        });
    }
}
