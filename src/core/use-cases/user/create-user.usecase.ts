import type { User } from "../../entities/user.entity";
import type { IUserRepository } from "../../repositories/user.repository";

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
