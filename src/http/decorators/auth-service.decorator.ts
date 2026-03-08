import fastifyPlugin from "fastify-plugin";
import { AuthService } from "../services/auth.service";
import { type FastifyInstance } from "fastify";
import { PrismaUserRepository } from "@infrastructure/repositories/prisma-user.repository";
import { PasswordService } from "@infrastructure/services/password.service";
import { CreateUserUseCase } from "@core/use-cases/create-user.usecase";
import { RegisterUseCase } from "@core/use-cases/register.usecase";
import { LoginUseCase } from "@core/use-cases/login.usecase";
import { JwtService } from "@infrastructure/services/jwt.service";
import { PrismaRefreshTokenRepository } from "@infrastructure/repositories/prisma-refresh-token.repository";
import { RefreshUseCase } from "@core/use-cases/refresh.usecase";
import { PrismaTransactionPort } from "@infrastructure/database/prisma-transaction-port";
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

    fastify.decorate(
        "authService",
        new AuthService(registerUseCase, loginUseCase, refreshUseCase),
    );
}

export default fastifyPlugin(authServiceDecorator);
