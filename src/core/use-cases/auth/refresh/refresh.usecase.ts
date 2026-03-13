import { UnauthorizedError } from "@core/errors/unauthorized.error";
import type {
    AuthTokenPort,
    UserPayload,
} from "@core/ports/services/auth-token.port";
import type { TransactionPort } from "@core/ports/services/transaction.port";
import type { RefreshInput } from "./refresh.input";
import type { RefreshOutput } from "./refresh.output";

export class RefreshUseCase {
    constructor(
        private readonly transactionService: TransactionPort,
        private readonly authTokenService: AuthTokenPort,
    ) {}

    async execute(input: RefreshInput): Promise<RefreshOutput> {
        return await this.transactionService.runInTransaction(async (ctx) => {
            const incomingTokenHash = this.authTokenService.hashRefreshSecret(
                input.token,
            );
            const currentToken =
                await ctx.refreshTokenRepository.findByTokenHash(
                    incomingTokenHash,
                );

            if (!currentToken) {
                throw new UnauthorizedError("Session not found");
            }

            if (currentToken.isRevoked) {
                await ctx.refreshTokenRepository.revokeAllByUserId(
                    currentToken.userId,
                );

                throw new UnauthorizedError(
                    "Security alert: Session compromised. All sessions revoked.",
                );
            }

            if (currentToken.isExpired()) {
                throw new UnauthorizedError("Session expired");
            }

            const user = await ctx.userRepository.findById(currentToken.userId);
            if (!user || user.isDeleted()) {
                throw new UnauthorizedError("User account unavailable");
            }

            currentToken.revoke();
            await ctx.refreshTokenRepository.update(currentToken);

            const payload: UserPayload = {
                id: user.id,
                username: user.username,
            };

            const {
                accessToken,
                expiresAt,
                refreshToken,
                refreshTokenExpiresAt,
            } = this.authTokenService.generate(payload);

            const refreshTokenHash =
                this.authTokenService.hashRefreshSecret(refreshToken);

            await ctx.refreshTokenRepository.create({
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
        });
    }
}
