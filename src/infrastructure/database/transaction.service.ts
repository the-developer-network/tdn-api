import type { PrismaClient } from "@generated/prisma/client";
import type {
    TransactionPort,
    TransactionContext,
} from "@core/ports/transaction.port";
import { PrismaUserRepository } from "../repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "../repositories/prisma-refresh-token.repository";

export class TransactionService implements TransactionPort {
    constructor(private readonly prisma: PrismaClient) {}

    async runInTransaction<T>(
        work: (ctx: TransactionContext) => Promise<T>,
    ): Promise<T> {
        return await this.prisma.$transaction(async (tx) => {
            const context: TransactionContext = {
                userRepository: new PrismaUserRepository(tx),
                refreshTokenRepository: new PrismaRefreshTokenRepository(tx),
            };

            return await work(context);
        });
    }
}
