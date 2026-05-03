import type { Prisma, User as PrismaUser } from "@generated/prisma/client";
import { User } from "@core/domain/entities/user.entity";
/**
 * Mapper class responsible for transforming User data across different layers.
 * Handles conversions between Prisma database records, Domain entities, and safe Response objects.
 */
export class UserPrismaMapper {
    /**
     * Maps a Prisma database record to a core Domain entity.
     *
     * @param dbUser - The user record retrieved from the Prisma database.
     * @returns The instantiated User domain entity.
     */
    static toDomainUser(dbUser: PrismaUser): User {
        return User.with({
            id: dbUser.id,
            email: dbUser.email,
            username: dbUser.username,
            passwordHash: dbUser.password,
            isBot: dbUser.isBot,
            isEmailVerified: dbUser.isEmailVerified,
            deletedAt: dbUser.deletedAt,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt,
        });
    }

    /**
     * Maps domain creation input to a Prisma-compatible creation object.
     *
     * @param input - The core user data required for creation.
     * @returns The Prisma-formatted input object for creating a new user record.
     */
    static toPrismaCreateUser(input: {
        email: string;
        username: string;
        passwordHash: string | null;
    }): Prisma.UserCreateInput {
        return {
            email: input.email,
            username: input.username,
            password: input.passwordHash,
        };
    }

    /**
     * Maps a Domain entity to a safe public response object.
     * Strips out sensitive information such as password hashes and soft-delete timestamps.
     *
     * @param user - The User domain entity.
     * @returns A sanitized user object safe for external API responses.
     */
    static toResponse(user: User): {
        id: string;
        username: string;
        email: string;
        isEmailVerified: boolean;
        isBot?: boolean;
        createdAt: Date;
        updatedAt: Date;
    } {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            isBot: user.isBot,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
