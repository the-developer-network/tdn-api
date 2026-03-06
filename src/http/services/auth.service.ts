import type { User } from "@core/entities/user.entity";
import type { LoginUseCase } from "@core/use-cases/login.usecase";
import type { RegisterUseCase } from "@core/use-cases/register.usecase";
import type {
    RegisterResponseData,
    RegisterBody,
    LoginBody,
    LoginResponse,
} from "@typings/schemas/auth.schema";

export class AuthService {
    constructor(
        private readonly registerUseCase: RegisterUseCase,
        private readonly loginUseCase: LoginUseCase,
    ) {}

    async register(body: RegisterBody): Promise<RegisterResponseData> {
        const user: User = await this.registerUseCase.execute(body);

        return {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt.toISOString(),
        };
    }

    async login(body: LoginBody): Promise<LoginResponse> {
        const result = await this.loginUseCase.execute(body);

        return result;
    }
}
