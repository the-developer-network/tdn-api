import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import { PrismaUserRepository } from "@infrastructure/repositories/prisma-user.repository";
import UserPrismaMapper from "@infrastructure/mappers/user-prisma.mapper";
import { UserAlreadyExistsError } from "@core/errors";
import { PrismaClientKnownRequestError } from "@generated/prisma/internal/prismaNamespace";
import type { PrismaTransactionalClient } from "@infrastructure/database/prisma-client.type";

vi.mock("@infrastructure/mappers/user-prisma.mapper", () => ({
    default: {
        toPrismaCreateUser: vi.fn(),
        toDomainUser: vi.fn(),
    },
}));

describe("Prisma User Repository", () => {
    /**
     * Arrange (Global)
     */
    let repository: PrismaUserRepository;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            user: {
                create: vi.fn(),
                findFirst: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
            },
        };

        repository = new PrismaUserRepository(
            mockPrisma as unknown as PrismaTransactionalClient,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Create User create()", () => {
        it("Should successfully create a user and return the mapped domain entity.", async () => {
            // Arrange
            const inputData = {
                email: "test@example.com",
                username: "testuser",
                passwordHash: "hashed_pass",
            };
            const mockPrismaCreateInput = {
                email: "test@example.com",
                username: "testuser",
                password: "hashed_pass",
            };
            const mockRawUser = { id: "user-1", ...mockPrismaCreateInput };
            const mockDomainUser = { id: "user-1", email: "test@example.com" };

            vi.mocked(UserPrismaMapper.toPrismaCreateUser).mockReturnValue(
                mockPrismaCreateInput as any,
            );
            vi.mocked(UserPrismaMapper.toDomainUser).mockReturnValue(
                mockDomainUser as any,
            );

            mockPrisma.user.create.mockResolvedValue(mockRawUser);

            // Act
            const result = await repository.create(inputData);

            // Assert
            expect(UserPrismaMapper.toPrismaCreateUser).toHaveBeenCalledWith(
                inputData,
            );
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: mockPrismaCreateInput,
            });
            expect(UserPrismaMapper.toDomainUser).toHaveBeenCalledWith(
                mockRawUser,
            );
            expect(result).toBe(mockDomainUser);
        });

        it("Should throw UserAlreadyExistsError if Prisma throws a P2002 error.", async () => {
            // Arrange
            const inputData = {
                email: "test@example.com",
                username: "testuser",
                passwordHash: "hashed_pass",
            };

            const prismaConflictError = new PrismaClientKnownRequestError(
                "Unique constraint failed",
                {
                    code: "P2002",
                    clientVersion: "1.0",
                    meta: { target: ["email"] },
                },
            );

            mockPrisma.user.create.mockRejectedValue(prismaConflictError);

            // Act & Assert
            await expect(repository.create(inputData)).rejects.toThrow(
                UserAlreadyExistsError,
            );
        });

        it("Should rethrow the error if it is not a P2002 Prisma error.", async () => {
            // Arrange
            const inputData = {
                email: "test@example.com",
                username: "testuser",
                passwordHash: "hashed_pass",
            };
            const genericError = new Error("Database connection lost");

            mockPrisma.user.create.mockRejectedValue(genericError);

            // Act & Assert
            await expect(repository.create(inputData)).rejects.toThrow(
                "Database connection lost",
            );
        });
    });

    describe("Find User By Identifier findByIdentifier()", () => {
        it("Should return the user domain entity if found by email or username.", async () => {
            // Arrange
            const identifier = "test@example.com";
            const mockRawUser = { id: "user-1", email: identifier };
            const mockDomainUser = { id: "user-1" };

            mockPrisma.user.findFirst.mockResolvedValue(mockRawUser);
            vi.mocked(UserPrismaMapper.toDomainUser).mockReturnValue(
                mockDomainUser as any,
            );

            // Act
            const result = await repository.findByIdentifier(identifier);

            // Assert
            expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [{ email: identifier }, { username: identifier }],
                },
            });
            expect(result).toBe(mockDomainUser);
        });

        it("Should return null if the user is not found.", async () => {
            // Arrange
            const identifier = "notfound@example.com";
            mockPrisma.user.findFirst.mockResolvedValue(null);

            // Act
            const result = await repository.findByIdentifier(identifier);

            // Assert
            expect(result).toBeNull();
            expect(UserPrismaMapper.toDomainUser).not.toHaveBeenCalled();
        });
    });

    describe("Find User By ID findById()", () => {
        it("Should return the user domain entity if found.", async () => {
            // Arrange
            const id = "user-123";
            const mockRawUser = { id };
            const mockDomainUser = { id };

            mockPrisma.user.findUnique.mockResolvedValue(mockRawUser);
            vi.mocked(UserPrismaMapper.toDomainUser).mockReturnValue(
                mockDomainUser as any,
            );

            // Act
            const result = await repository.findById(id);

            // Assert
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id },
            });
            expect(result).toBe(mockDomainUser);
        });

        it("Should return null if the user is not found by ID.", async () => {
            // Arrange
            mockPrisma.user.findUnique.mockResolvedValue(null);

            // Act
            const result = await repository.findById("unknown-id");

            // Assert
            expect(result).toBeNull();
        });
    });

    describe("Update User update()", () => {
        it("Should update the user in the database with the provided fields.", async () => {
            // Arrange
            const mockDomainUser = {
                id: "user-123",
                email: "new@example.com",
                username: "newuser",
                passwordHash: "new_hash",
                isEmailVerified: true,
                deletedAt: null,
            };

            // Act
            await repository.update(mockDomainUser as any);

            // Assert
            expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: mockDomainUser.id },
                data: {
                    email: mockDomainUser.email,
                    username: mockDomainUser.username,
                    password: mockDomainUser.passwordHash,
                    isEmailVerified: mockDomainUser.isEmailVerified,
                    deletedAt: mockDomainUser.deletedAt,
                },
            });
        });
    });

    describe("Find User By Email findByEmail()", () => {
        it("Should return the user domain entity if found by exact email.", async () => {
            // Arrange
            const email = "exact@example.com";
            const mockRawUser = { id: "user-1", email };
            const mockDomainUser = { id: "user-1" };

            mockPrisma.user.findFirst.mockResolvedValue(mockRawUser);
            vi.mocked(UserPrismaMapper.toDomainUser).mockReturnValue(
                mockDomainUser as any,
            );

            // Act
            const result = await repository.findByEmail(email);

            // Assert
            expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
                where: { email },
            });
            expect(result).toBe(mockDomainUser);
        });

        it("Should return null if the user is not found by email.", async () => {
            // Arrange
            mockPrisma.user.findFirst.mockResolvedValue(null);

            // Act
            const result = await repository.findByEmail("unknown@example.com");

            // Assert
            expect(result).toBeNull();
        });
    });
});
