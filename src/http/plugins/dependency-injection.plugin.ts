import type { FastifyInstance } from "fastify";
import { diContainer, fastifyAwilixPlugin } from "@fastify/awilix";
import { asClass, asFunction, asValue, InjectionMode } from "awilix";
import fastifyPlugin from "fastify-plugin";

// --- Altyapı (Infrastructure) Imports ---
import { PrismaUserRepository } from "@infrastructure/repositories/prisma-user.repository";
import { PrismaRefreshTokenRepository } from "@infrastructure/repositories/prisma-refresh-token.repository";
import { PrismaVerificationTokenRepository } from "@infrastructure/repositories/prisma-verification-token.repository";
import { TransactionService } from "@infrastructure/database/transaction.service";
import { PasswordService } from "@infrastructure/services/password.service";
import { EmailService } from "@infrastructure/services/email.service";
import { AuthTokenService } from "@infrastructure/services/auth-token.service";
import { OtpService } from "@infrastructure/services/otp.service";

// --- Use Cases Imports ---
import SoftDeleteUserUseCase from "@core/use-cases/user/soft-delete-user.usecase";
import { CreateUserUseCase } from "@core/use-cases/user/create-user.usecase";
import { RegisterUseCase } from "@core/use-cases/auth/register.usecase";
import { LoginUseCase } from "@core/use-cases/auth/login.usecase";
import { RefreshUseCase } from "@core/use-cases/auth/refresh.usecase";
import { LogoutUseCase } from "@core/use-cases/auth/logout.usecase";
import { SendVerificationEmailUseCase } from "@core/use-cases/auth/send-verification-email.usecase";
import { VerifyEmailUseCase } from "@core/use-cases/auth/verify-email.usecase";
import { ForgotPasswordUseCase } from "@core/use-cases/auth/forgot-password.usecase";
import { ResetPasswordUseCase } from "@core/use-cases/auth/reset-password.usecase";
import { RecoverAccountUseCase } from "@core/use-cases/auth/recover-account.usecase";

// --- Ana Servisler (Facades) Imports ---
import UserService from "@services/user.service";
import { AuthService } from "@services/auth.service";

function dependencyInjectionPlugin(fastify: FastifyInstance): void {
    fastify.register(fastifyAwilixPlugin, {
        disposeOnClose: true,
        disposeOnResponse: false,
    });

    diContainer.options.injectionMode = InjectionMode.CLASSIC;

    diContainer.register({
        prisma: asValue(fastify.prisma),
        logger: asValue(fastify.log),
        config: asValue(fastify.config),
        jwt: asValue(fastify.jwt),

        userRepository: asClass(PrismaUserRepository).singleton(),
        refreshTokenRepository: asClass(
            PrismaRefreshTokenRepository,
        ).singleton(),
        verificationTokenRepository: asClass(
            PrismaVerificationTokenRepository,
        ).singleton(),

        transactionService: asClass(TransactionService).singleton(),

        passwordService: asClass(PasswordService).singleton(),
        otpService: asClass(OtpService).singleton(),

        emailService: asFunction((config, logger) => {
            return new EmailService(
                {
                    host: config.SMTP_HOST,
                    port: config.SMTP_PORT,
                    secure: config.SMTP_SECURE,
                    user: config.SMTP_USER,
                    pass: config.SMTP_PASS,
                    from: config.EMAIL_FROM,
                },
                logger,
            );
        }).singleton(),

        authTokenService: asFunction((jwt, config) => {
            return new AuthTokenService(
                jwt,
                config.ACCESS_TOKEN_EXPIRES_IN,
                config.REFRESH_TOKEN_EXPIRES_IN,
            );
        }).singleton(),

        softDeleteUserUseCase: asFunction(
            (userRepository, passwordService, emailService) => {
                return new SoftDeleteUserUseCase(
                    userRepository,
                    passwordService,
                    emailService,
                    { day: 30 },
                );
            },
        ).singleton(),
        createUserUseCase: asClass(CreateUserUseCase).singleton(),

        // AUTH
        registerUseCase: asClass(RegisterUseCase).singleton(),
        loginUseCase: asClass(LoginUseCase).singleton(),
        refreshUseCase: asClass(RefreshUseCase).singleton(),
        logoutUseCase: asClass(LogoutUseCase).singleton(),
        sendVerificationEmailUseCase: asClass(
            SendVerificationEmailUseCase,
        ).singleton(),
        verifyEmailUseCase: asClass(VerifyEmailUseCase).singleton(),
        forgotPasswordUseCase: asClass(ForgotPasswordUseCase).singleton(),
        resetPasswordUseCase: asClass(ResetPasswordUseCase).singleton(),
        recoverAccountUseCase: asClass(RecoverAccountUseCase).singleton(),

        userService: asClass(UserService).singleton(),
        authService: asClass(AuthService).singleton(),
    });
}

export default fastifyPlugin(dependencyInjectionPlugin, {
    name: "di-plugin",
    dependencies: ["prisma-plugin"],
});
