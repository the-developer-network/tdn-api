import type { User } from "../entities/user.entity";

export interface IUserRepository {
    create(data: {
        email: string;
        username: string;
        passwordHash: string | null;
    }): Promise<User>;
    findByIdentifier(identifier: string): Promise<User | null>;
}
