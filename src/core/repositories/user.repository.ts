import type { User } from "../entities/user.entity";

export interface IUserRepository {
    create(data: {
        email: string;
        username: string;
        passwordHash: string | null;
    }): Promise<User>;
    findByIdentifier(identifier: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    update(user: User): Promise<void>;
    findByEmail(email: string): Promise<User | null>;
    softDeleteById(id: string, deletedAt: Date): Promise<void>;
    restoreById(id: string): Promise<void>;
}
