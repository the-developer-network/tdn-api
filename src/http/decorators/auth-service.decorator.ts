import fastifyPlugin from "fastify-plugin";
import { AuthService } from "../services/auth.service";
import { type FastifyInstance } from "fastify";
import { PrismaUserRepository } from "@infrastructure/repositories/prisma-user.repository";
import { PasswordService } from "@infrastructure/services/password.service";
import { CreateUserUseCase } from "@core/use-cases/create-user.usecase";
import { RegisterUseCase } from "@core/use-cases/register.usecase";
import { LoginUseCase } from "@core/use-cases/login.usecase";
import { JwtService } from "@infrastructure/services/jwt.service";
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
    );

    const loginUseCase = new LoginUseCase(
        userRepo,
        passwordService,
        jwtService,
    );

    fastify.decorate(
        "authService",
        new AuthService(registerUseCase, loginUseCase),
    );
}

export default fastifyPlugin(authServiceDecorator);
