import { describe, it, expect } from "vitest";
import UserPrismaMapper from "@infrastructure/mappers/user-prisma.mapper";
import { User } from "@core/entities/user.entity";
import type { User as PrismaUser } from "@generated/prisma/client";

describe("User Prisma Mapper", () => {
    describe("toDomainUser()", () => {
        it("Should correctly map a Prisma user record to a domain User entity.", () => {
            /**
             * Arrange
             */
            const mockDbUser: PrismaUser = {
                id: "user-123",
                email: "test@example.com",
                username: "testuser",
                password: "hashed_password_string",
                isEmailVerified: true,
                deletedAt: null,
                createdAt: new Date("2026-03-10T10:00:00Z"),
                updatedAt: new Date("2026-03-10T12:00:00Z"),
            };

            /**
             * Act
             */
            const domainUser = UserPrismaMapper.toDomainUser(mockDbUser);

            /**
             * Assert
             */
            expect(domainUser).toBeInstanceOf(User);
            expect(domainUser.id).toBe(mockDbUser.id);
            expect(domainUser.email).toBe(mockDbUser.email);
            expect(domainUser.username).toBe(mockDbUser.username);

            expect(domainUser.passwordHash).toBe(mockDbUser.password);

            expect(domainUser.isEmailVerified).toBe(mockDbUser.isEmailVerified);
            expect(domainUser.deletedAt).toBe(mockDbUser.deletedAt);
            expect(domainUser.createdAt).toBe(mockDbUser.createdAt);
            expect(domainUser.updatedAt).toBe(mockDbUser.updatedAt);
        });
    });

    describe("toPrismaCreateUser()", () => {
        it("Should correctly map domain input data to a Prisma UserCreateInput object.", () => {
            /**
             * Arrange
             */
            const domainInput = {
                email: "new@example.com",
                username: "newuser",
                passwordHash: "new_hashed_password",
            };

            /**
             * Act
             */
            const prismaInput =
                UserPrismaMapper.toPrismaCreateUser(domainInput);

            /**
             * Assert
             */
            expect(prismaInput.email).toBe(domainInput.email);
            expect(prismaInput.username).toBe(domainInput.username);
            expect(prismaInput.password).toBe(domainInput.passwordHash);
            expect(prismaInput).not.toHaveProperty("id");
            expect(prismaInput).not.toHaveProperty("createdAt");
        });

        it("Should correctly map when passwordHash is null.", () => {
            /**
             * Arrange
             */
            const domainInput = {
                email: "oauth@example.com",
                username: "oauthuser",
                passwordHash: null,
            };

            /**
             * Act
             */
            const prismaInput =
                UserPrismaMapper.toPrismaCreateUser(domainInput);

            /**
             * Assert
             */
            expect(prismaInput.password).toBeNull();
        });
    });
});
