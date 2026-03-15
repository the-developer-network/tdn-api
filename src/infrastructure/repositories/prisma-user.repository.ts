import type { User } from "@core/entities/user.entity";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import UserPrismaMapper from "../mappers/user-prisma.mapper";
import { UserAlreadyExistsError } from "@core/errors";
import { PrismaClientKnownRequestError } from "@generated/prisma/internal/prismaNamespace";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";

export interface PrismaUserRepositoryOptions {
    gracePeriodDays: number;
}

export class PrismaUserRepository implements IUserRepository {
    constructor(
        private readonly prisma: PrismaTransactionalClient,
        private readonly options: PrismaUserRepositoryOptions,
    ) {}

    async create(data: {
        email: string;
        username: string;
        passwordHash: string | null;
    }): Promise<User> {
        try {
            const user = await this.prisma.user.create({
                data: UserPrismaMapper.toPrismaCreateUser(data),
            });

            return UserPrismaMapper.toDomainUser(user);
        } catch (error: unknown) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === "P2002") throw new UserAlreadyExistsError();
            }

            throw error;
        }
    }

    async createWithOAuth(data: {
        email: string;
        username: string;
        provider: string;
        providerAccountId: string;
    }): Promise<User> {
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: data.email,
                    username: data.username,
                    password: null,

                    oauthAccounts: {
                        create: {
                            provider: data.provider,
                            providerAccountId: data.providerAccountId,
                        },
                    },
                },
            });

            return UserPrismaMapper.toDomainUser(user);
        } catch (error: unknown) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === "P2002") throw new UserAlreadyExistsError();
            }

            throw error;
        }
    }

    async findByIdentifier(identifier: string): Promise<User | null> {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { username: identifier }],
            },
        });

        if (!user) return null;

        return UserPrismaMapper.toDomainUser(user);
    }

    async findById(id: string): Promise<User | null> {
        const rawUser = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!rawUser) return null;

        return UserPrismaMapper.toDomainUser(rawUser);
    }

    async update(user: User): Promise<void> {
        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                email: user.email,
                username: user.username,
                password: user.passwordHash,
                isEmailVerified: user.isEmailVerified,
                deletedAt: user.deletedAt,
            },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        const rawUser = await this.prisma.user.findFirst({ where: { email } });

        if (!rawUser) return null;

        return UserPrismaMapper.toDomainUser(rawUser);
    }

    async softDeleteById(id: string): Promise<void> {
        await this.prisma.user.update({
            where: {
                id,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    async restoreById(id: string): Promise<void> {
        await this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: null,
            },
        });
    }

    async findByUsername(username: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { username } });

        if (!user) return null;

        return UserPrismaMapper.toDomainUser(user);
    }

    async deleteExpiredUser(): Promise<number> {
        const cutoffDate = new Date();

        cutoffDate.setDate(cutoffDate.getDate() - this.options.gracePeriodDays);

        const result = await this.prisma.user.deleteMany({
            where: {
                deletedAt: {
                    not: null,
                    lte: cutoffDate,
                },
            },
        });
        return result.count;
    }
}
