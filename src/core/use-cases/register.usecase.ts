import type { User } from "../entities/user.entity";
import type { PasswordPort } from "../ports/password.port";
import type { CreateUserUseCase } from "./create-user.usecase";

export class RegisterUseCase {
    constructor(
        private readonly createUser: CreateUserUseCase,
        private readonly password: PasswordPort,
    ) {}

    async execute(input: {
        email: string;
        username: string;
        password: string;
    }): Promise<User> {
        const passwordHash = await this.password.hash(input.password);

        return this.createUser.execute({
            username: input.username,
            email: input.email,
            passwordHash,
        });
    }
}
