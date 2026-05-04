import { User } from "@core/domain/entities/user.entity";
import type { UserProps } from "@core/domain/interfaces/user-props.interface";

export function buildUser(overrides: Partial<UserProps> = {}): User {
    return User.with({
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        passwordHash: "hashed_password",
        isEmailVerified: true,
        isBot: false,
        deletedAt: null,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        ...overrides,
    });
}
