import type { PrismaClient } from "@generated/prisma/client";
import type {
    TransactionPort,
    TransactionContext,
} from "@core/ports/services/transaction.port";
import { PrismaUserRepository } from "../repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "../repositories/prisma-refresh-token.repository";
import type { FastifyInstance } from "fastify";

export class TransactionService implements TransactionPort {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly config: FastifyInstance["config"],
    ) {}

    async runInTransaction<T>(
        work: (ctx: TransactionContext) => Promise<T>,
    ): Promise<T> {
        return await this.prisma.$transaction(async (tx) => {
            const context: TransactionContext = {
                userRepository: new PrismaUserRepository(tx, {
                    gracePeriodDays: this.config.USER_PURGE_GRACE_PERIOD_DAYS,
                }),
                refreshTokenRepository: new PrismaRefreshTokenRepository(tx, {
                    gracePeriodDays:
                        this.config.REFRESH_TOKEN_PURGE_GRACE_PERIOD_DAYS,
                }),
            };

            return await work(context);
        });
    }
}
