import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mocked,
} from "vitest";
import {
    RegisterUseCase,
    type RegisterInput,
} from "@core/use-cases/auth/register.usecase";
import type { CreateUserUseCase } from "@core/use-cases/user/create-user.usecase";
import type { PasswordPort } from "@core/ports/password.port";

describe("Register Use Case", () => {
    let registerUseCase: RegisterUseCase;
    let mockCreateUserUseCase: Mocked<CreateUserUseCase>;
    let mockPasswordService: Mocked<PasswordPort>;

    let validRequest: RegisterInput;
    let mockUser: any;

    beforeEach(() => {
        mockCreateUserUseCase = {
            execute: vi.fn(),
        } as unknown as Mocked<CreateUserUseCase>;

        mockPasswordService = {
            hash: vi.fn(),
            verify: vi.fn(),
        };

        registerUseCase = new RegisterUseCase(
            mockCreateUserUseCase,
            mockPasswordService,
        );

        validRequest = {
            email: "newuser@example.com",
            username: "newuser",
            password: "SecurePassword123!",
        };

        mockUser = {
            id: "user-123",
            email: "newuser@example.com",
            username: "newuser",
            passwordHash: "hashed_password_string",
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("execute()", () => {
        it("Should successfully hash the password, delegate to CreateUserUseCase, and return the user.", async () => {
            /** Arrange */
            const expectedHash = "hashed_password_string";

            mockPasswordService.hash.mockResolvedValue(expectedHash);
            mockCreateUserUseCase.execute.mockResolvedValue(mockUser);

            /** Act */
            const result = await registerUseCase.execute(validRequest);

            /** Assert */
            expect(mockPasswordService.hash).toHaveBeenCalledTimes(1);
            expect(mockPasswordService.hash).toHaveBeenCalledWith(
                validRequest.password,
            );

            expect(mockCreateUserUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith({
                username: validRequest.username,
                email: validRequest.email,
                passwordHash: expectedHash,
            });

            expect(result).toEqual(mockUser);
        });

        it("Should throw and stop execution if password hashing fails.", async () => {
            /** Arrange */
            const mockError = new Error("Hashing algorithm failed");
            mockPasswordService.hash.mockRejectedValue(mockError);

            /** Act & Assert */
            await expect(registerUseCase.execute(validRequest)).rejects.toThrow(
                mockError,
            );

            // Critical check: Should not attempt to create user if hashing fails
            expect(mockCreateUserUseCase.execute).not.toHaveBeenCalled();
        });

        it("Should propagate the error if CreateUserUseCase fails (e.g., UserAlreadyExists).", async () => {
            /** Arrange */
            const expectedHash = "hashed_password_string";
            const mockError = new Error("User already exists");

            mockPasswordService.hash.mockResolvedValue(expectedHash);
            mockCreateUserUseCase.execute.mockRejectedValue(mockError);

            /** Act & Assert */
            await expect(registerUseCase.execute(validRequest)).rejects.toThrow(
                mockError,
            );

            expect(mockPasswordService.hash).toHaveBeenCalledWith(
                validRequest.password,
            );
            expect(mockCreateUserUseCase.execute).toHaveBeenCalledTimes(1);
        });
    });
});
