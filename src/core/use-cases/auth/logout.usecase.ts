import type { TokenPort } from "@core/ports/token.port";
import type { TransactionPort } from "@core/ports/transaction.port";

export interface LogoutInput {
    token: string;
}

export class LogoutUseCase {
    constructor(
        private readonly transactionPort: TransactionPort,
        private readonly tokenService: TokenPort,
    ) {}

    async execute(input: LogoutInput): Promise<void> {
        if (!input.token) {
            return;
        }

        await this.transactionPort.runInTransaction(async (ctx) => {
            const tokenHash = this.tokenService.hashRefreshSecret(input.token);

            const currentToken =
                await ctx.refreshTokenRepository.findByTokenHash(tokenHash);

            if (currentToken && !currentToken.isRevoked) {
                currentToken.revoke();

                await ctx.refreshTokenRepository.update(currentToken);
            }
        });
    }
}
