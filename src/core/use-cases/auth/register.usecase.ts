import type { PasswordPort } from "@core/ports/password.port";
import type { CreateUserUseCase } from "../user/create-user.usecase";
import type { User } from "@core/entities/user.entity";

export interface RegisterInput {
    email: string;
    username: string;
    password: string;
}

export class RegisterUseCase {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly passwordService: PasswordPort,
    ) {}

    async execute(input: RegisterInput): Promise<User> {
        const passwordHash = await this.passwordService.hash(input.password);

        return this.createUserUseCase.execute({
            username: input.username,
            email: input.email,
            passwordHash,
        });
    }
}
