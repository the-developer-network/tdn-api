import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mocked,
} from "vitest";
import { CreateUserUseCase } from "@core/use-cases/user/create-user.usecase";
import type { IUserRepository } from "@core/repositories/user.repository";

describe("Create User Use Case", () => {
    let createUserUseCase: CreateUserUseCase;
    let mockUserRepository: Mocked<IUserRepository>;

    let validRequest: {
        email: string;
        username: string;
        passwordHash: string | null;
    };
    let mockUser: any;

    beforeEach(() => {
        mockUserRepository = {
            create: vi.fn(),
            findByIdentifier: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            findByEmail: vi.fn(),
        } as unknown as Mocked<IUserRepository>;

        createUserUseCase = new CreateUserUseCase(mockUserRepository);

        validRequest = {
            email: "test@example.com",
            username: "testuser",
            passwordHash: "secure_hashed_string",
        };

        mockUser = {
            id: "user-123",
            email: "test@example.com",
            username: "testuser",
            passwordHash: "secure_hashed_string",
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should successfully delegate user creation to the repository and return the user.", async () => {
            /** Arrange */
            mockUserRepository.create.mockResolvedValue(mockUser);

            /** Act */
            const result = await createUserUseCase.execute(validRequest);

            /** Assert */
            expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
            expect(mockUserRepository.create).toHaveBeenCalledWith(
                validRequest,
            );

            expect(result).toEqual(mockUser);
        });

        it("Should successfully create a user without a password (e.g., OAuth flow).", async () => {
            /** Arrange */
            const oauthRequest = { ...validRequest, passwordHash: null };
            const oauthUser = { ...mockUser, passwordHash: null };

            mockUserRepository.create.mockResolvedValue(oauthUser);

            /** Act */
            const result = await createUserUseCase.execute(oauthRequest);

            /** Assert */
            expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
            expect(mockUserRepository.create).toHaveBeenCalledWith(
                oauthRequest,
            );

            expect(result).toEqual(oauthUser);
        });

        it("Should propagate any errors thrown by the repository.", async () => {
            /** Arrange */
            const mockError = new Error("Database connection failed");
            mockUserRepository.create.mockRejectedValue(mockError);

            /** Act & Assert */
            await expect(
                createUserUseCase.execute(validRequest),
            ).rejects.toThrow(mockError);

            expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
        });
    });
});
