import type { User } from "@core/entities/user.entity";
import type { IUserRepository } from "@core/ports/repositories/user.repository";

export class CreateUserUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(input: {
        email: string;
        username: string;
        passwordHash: string | null;
    }): Promise<User> {
        return this.userRepository.create(input);
    }
}
