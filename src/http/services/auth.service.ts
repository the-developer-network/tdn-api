import type { User } from "@core/entities/user.entity";
import type {
    LoginInput,
    LoginOutput,
    LoginUseCase,
} from "@core/use-cases/auth/login.usecase";
import type {
    LogoutInput,
    LogoutUseCase,
} from "@core/use-cases/auth/logout.usecase";
import type {
    RefreshInput,
    RefreshOutput,
    RefreshUseCase,
} from "@core/use-cases/auth/refresh.usecase";
import type {
    RegisterInput,
    RegisterUseCase,
} from "@core/use-cases/auth/register.usecase";

export class AuthService {
    constructor(
        private readonly registerUseCase: RegisterUseCase,
        private readonly loginUseCase: LoginUseCase,
        private readonly refreshUseCase: RefreshUseCase,
        private readonly logoutUseCase: LogoutUseCase,
    ) {}

    async register(input: RegisterInput): Promise<User> {
        const user: User = await this.registerUseCase.execute(input);
        return user;
    }

    async login(input: LoginInput): Promise<LoginOutput> {
        const result = await this.loginUseCase.execute(input);
        return result;
    }

    async refresh(input: RefreshInput): Promise<RefreshOutput> {
        return await this.refreshUseCase.execute(input);
    }

    async logout(input: LogoutInput): Promise<void> {
        return await this.logoutUseCase.execute(input);
    }
}
