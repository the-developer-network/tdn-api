import type { PasswordPort } from "@core/ports/services/password.port";
import type { User } from "@core/entities/user.entity";
import type { CreateUserUseCase } from "@core/use-cases/user/create-user/create-user.usecase";
import type { RegisterInput } from "./register.input";

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
