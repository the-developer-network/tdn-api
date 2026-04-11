import type { Prisma, User as PrismaUser } from "@generated/prisma/client";
import { User } from "@core/domain/entities/user.entity";
import type { UserProps } from "@core/domain/interfaces/user-props.interface";
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
        return new User({
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
    static toResponse(
        user: User,
    ): Omit<UserProps, "passwordHash" | "deletedAt"> {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
