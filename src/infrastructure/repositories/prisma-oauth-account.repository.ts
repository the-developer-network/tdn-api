import type { IOAuthAccountRepository } from "@core/ports/repositories/oauth-account.repository";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";

export class PrismaOAuthAccountRepository implements IOAuthAccountRepository {
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    async findProvidersByUserId(userId: string): Promise<string[]> {
        const accounts = await this.prisma.oAuthAccount.findMany({
            where: {
                userId: userId,
            },
            select: {
                provider: true,
            },
        });

        return accounts.map((account) => account.provider);
    }
}
