import fastifyPlugin from "fastify-plugin";
import { AuthService } from "../services/auth.service";
import { type FastifyInstance } from "fastify";
import { PrismaUserRepository } from "@infrastructure/repositories/prisma-user.repository";
import { PasswordService } from "@infrastructure/services/password.service";
import { CreateUserUseCase } from "@core/use-cases/user/create-user.usecase";
import { RegisterUseCase } from "@core/use-cases/auth/register.usecase";
import { LoginUseCase } from "@core/use-cases/auth/login.usecase";
import { JwtService } from "@infrastructure/services/jwt.service";
import { PrismaRefreshTokenRepository } from "@infrastructure/repositories/prisma-refresh-token.repository";
import { RefreshUseCase } from "@core/use-cases/auth/refresh.usecase";
import { PrismaTransactionPort } from "@infrastructure/database/prisma-transaction-port";
import { LogoutUseCase } from "@core/use-cases/auth/logout.usecase";
import { PrismaVerificationTokenRepository } from "@infrastructure/repositories/prisma-verification-token.repository";
import { NodemailerEmailService } from "@infrastructure/services/nodemailer-email.service";
import { SendVerificationEmailUseCase } from "@core/use-cases/auth/send-verification-email.usecase";
import { VerifyEmailUseCase } from "@core/use-cases/auth/verify-email.usecase";
import { ForgotPasswordUseCase } from "@core/use-cases/auth/forgot-password.usecase";
import { ResetPasswordUseCase } from "@core/use-cases/auth/reset-password.usecase";
import { OtpService } from "@infrastructure/services/otp.service";

function authServiceDecorator(fastify: FastifyInstance): void {
    const userRepo = new PrismaUserRepository(fastify.prisma);
    const passwordService = new PasswordService();
    const createUserUseCase = new CreateUserUseCase(userRepo);
    const registerUseCase = new RegisterUseCase(
        createUserUseCase,
        passwordService,
    );
    const jwtService = new JwtService(
        fastify,
        fastify.config.ACCESS_TOKEN_EXPIRES_IN,
        fastify.config.REFRESH_TOKEN_EXPIRES_IN,
    );
    const refreshTokenRepo = new PrismaRefreshTokenRepository(fastify.prisma);

    const loginUseCase = new LoginUseCase(
        userRepo,
        passwordService,
        jwtService,
        refreshTokenRepo,
    );

    const transactionPort = new PrismaTransactionPort(fastify.prisma);

    const refreshUseCase = new RefreshUseCase(transactionPort, jwtService);

    const logoutUseCase = new LogoutUseCase(transactionPort, jwtService);

    const verificationTokenRepo = new PrismaVerificationTokenRepository(
        fastify.prisma,
    );

    const emailService = new NodemailerEmailService(
        {
            host: fastify.config.SMTP_HOST,
            port: fastify.config.SMTP_PORT,
            secure: fastify.config.SMTP_SECURE,
            user: fastify.config.SMTP_USER,
            pass: fastify.config.SMTP_PASS,
            from: fastify.config.EMAIL_FROM,
        },
        fastify.log,
    );

    const otpService = new OtpService();

    const sendVerificationEmailUseCase = new SendVerificationEmailUseCase(
        userRepo,
        verificationTokenRepo,
        jwtService,
        emailService,
        otpService,
    );

    const verifyEmailUseCase = new VerifyEmailUseCase(
        userRepo,
        verificationTokenRepo,
        otpService,
    );

    const forgotPasswordUseCase = new ForgotPasswordUseCase(
        userRepo,
        verificationTokenRepo,
        emailService,
        otpService,
    );

    const resetPasswordUseCase = new ResetPasswordUseCase(
        userRepo,
        verificationTokenRepo,
        jwtService,
        passwordService,
        otpService,
    );

    fastify.decorate(
        "authService",
        new AuthService(
            registerUseCase,
            loginUseCase,
            refreshUseCase,
            logoutUseCase,
            sendVerificationEmailUseCase,
            verifyEmailUseCase,
            forgotPasswordUseCase,
            resetPasswordUseCase,
        ),
    );
}

export default fastifyPlugin(authServiceDecorator);
