import type { User } from "@core/entities/user.entity";
import type {
    ForgotPasswordInput,
    ForgotPasswordUseCase,
} from "@core/use-cases/auth/forgot-password.usecase";
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
    RecoverAccountInput,
    RecoverAccountUseCase,
} from "@core/use-cases/auth/recover-account.usecase";

import type {
    RefreshInput,
    RefreshOutput,
    RefreshUseCase,
} from "@core/use-cases/auth/refresh.usecase";
import type {
    RegisterInput,
    RegisterUseCase,
} from "@core/use-cases/auth/register.usecase";
import type {
    ResetPasswordInput,
    ResetPasswordUseCase,
} from "@core/use-cases/auth/reset-password.usecase";
import type {
    SendVerificationEmailInput,
    SendVerificationEmailUseCase,
} from "@core/use-cases/auth/send-verification-email.usecase";
import type {
    VerifyEmailInput,
    VerifyEmailUseCase,
} from "@core/use-cases/auth/verify-email.usecase";

export class AuthService {
    constructor(
        private readonly registerUseCase: RegisterUseCase,
        private readonly loginUseCase: LoginUseCase,
        private readonly refreshUseCase: RefreshUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
        private readonly verifyEmailUseCase: VerifyEmailUseCase,
        private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly recoverAccountUseCase: RecoverAccountUseCase,
    ) {}

    async register(input: RegisterInput): Promise<User> {
        return this.registerUseCase.execute(input);
    }

    async login(input: LoginInput): Promise<LoginOutput> {
        return this.loginUseCase.execute(input);
    }

    async refresh(input: RefreshInput): Promise<RefreshOutput> {
        return this.refreshUseCase.execute(input);
    }

    async logout(input: LogoutInput): Promise<void> {
        return this.logoutUseCase.execute(input);
    }

    async sendVerificationEmail(
        input: SendVerificationEmailInput,
    ): Promise<void> {
        return this.sendVerificationEmailUseCase.execute(input);
    }

    async verifyEmail(input: VerifyEmailInput): Promise<void> {
        return this.verifyEmailUseCase.execute(input);
    }

    async forgotPassword(input: ForgotPasswordInput): Promise<void> {
        return this.forgotPasswordUseCase.execute(input);
    }

    async resetPassword(input: ResetPasswordInput): Promise<void> {
        return this.resetPasswordUseCase.execute(input);
    }

    async recoveryAccount(input: RecoverAccountInput): Promise<LoginOutput> {
        return this.recoverAccountUseCase.execute(input);
    }
}
