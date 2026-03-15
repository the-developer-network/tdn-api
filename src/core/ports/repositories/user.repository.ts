import type { User } from "../../entities/user.entity";

/**
 * Interface for User persistence operations.
 * Following Clean Architecture, this contract abstracts the underlying database technology (Prisma, MongoDB, etc.)
 * from the Domain Layer.
 */
export interface IUserRepository {
    /**
     * Persists a new user entity with standard password credentials.
     * @param data - Object containing email, username, and hashed password.
     * @returns The newly created User entity.
     */
    create(data: {
        email: string;
        username: string;
        passwordHash: string | null;
    }): Promise<User>;

    /**
     * Retrieves a user by either their email or username.
     * Useful for login scenarios where the identifier type is unknown.
     * @param identifier - The email address or username string.
     * @returns User entity if found, otherwise null.
     */
    findByIdentifier(identifier: string): Promise<User | null>;

    /**
     * Retrieves a user by their unique primary identifier (UUID).
     * @param id - The unique user ID.
     * @returns User entity if found, otherwise null.
     */
    findById(id: string): Promise<User | null>;

    /**
     * Synchronizes the state of a User domain entity with the persistence layer.
     * Should be called after modifying entity properties.
     * @param user - The User entity containing updated values.
     */
    update(user: User): Promise<void>;

    /**
     * Finds a user specifically by their registered email address.
     * @param email - Validated email string.
     * @returns User entity if found, otherwise null.
     */
    findByEmail(email: string): Promise<User | null>;

    /**
     * Marks a user as deleted without physical removal (Soft Delete).
     * Populates the 'deletedAt' field to prevent the user from appearing in standard queries.
     * @param id - The ID of the user to be deactivated.
     */
    softDeleteById(id: string): Promise<void>;

    /**
     * Reverses a soft-delete operation.
     * Clears the 'deletedAt' field, restoring the user's access to the system.
     * @param id - The ID of the user to be restored.
     */
    restoreById(id: string): Promise<void>;

    /**
     * Finds a user specifically by their unique username.
     * @param username - The username string.
     * @returns User entity if found, otherwise null.
     */
    findByUsername(username: string): Promise<User | null>;

    /**
     * Registers a user originating from an external OAuth provider (Google, GitHub, etc.).
     * @param data - Social profile data including provider details.
     * @returns The newly created User entity.
     */
    createWithOAuth(data: {
        email: string;
        username: string;
        provider: string;
        providerAccountId: string;
    }): Promise<User>;

    /**
     * Physically removes users whose soft-deletion grace period has expired.
     * This method performs a 'Hard Delete' for accounts marked for deletion older than the specified threshold.
     * @returns The count of successfully purged records.
     */
    deleteExpiredUser(): Promise<number>;
}
