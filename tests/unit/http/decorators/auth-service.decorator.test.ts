import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import authServiceDecorator from "@decorators/auth-service.decorator";
import { AuthService } from "@services/auth.service";

// Mocking all infrastructure and core components to avoid real instantiations
vi.mock("@infrastructure/repositories/prisma-user.repository");
vi.mock("@infrastructure/repositories/prisma-refresh-token.repository");
vi.mock("@infrastructure/repositories/prisma-verification-token.repository");
vi.mock("@infrastructure/services/password.service");
vi.mock("@infrastructure/services/jwt.service");
vi.mock("@infrastructure/services/nodemailer-email.service");
vi.mock("@infrastructure/services/otp.service");
vi.mock("@infrastructure/database/prisma-transaction-port");
vi.mock("@core/use-cases/user/create-user.usecase");
vi.mock("@core/use-cases/auth/register.usecase");
vi.mock("@core/use-cases/auth/login.usecase");
vi.mock("@core/use-cases/auth/refresh.usecase");
vi.mock("@core/use-cases/auth/logout.usecase");
vi.mock("@core/use-cases/auth/send-verification-email.usecase");
vi.mock("@core/use-cases/auth/verify-email.usecase");
vi.mock("@core/use-cases/auth/forgot-password.usecase");
vi.mock("@core/use-cases/auth/reset-password.usecase");
vi.mock("@services/auth.service");

describe("Auth Service Plugin", () => {
    let app: FastifyInstance;

    const mockConfig = {
        ACCESS_TOKEN_EXPIRES_IN: 900,
        REFRESH_TOKEN_EXPIRES_IN: 86400,
        SMTP_HOST: "localhost",
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_USER: "user",
        SMTP_PASS: "pass",
        EMAIL_FROM: "noreply@test.com",
    };

    beforeEach(() => {
        app = Fastify();

        app.decorate("prisma", {} as any);
        app.decorate("config", mockConfig as any);
    });

    afterEach(async () => {
        vi.clearAllMocks();
        await app.close();
    });

    it("Should successfully instantiate all dependencies and decorate fastify with 'authService'.", async () => {
        /** Arrange & Act */
        await app.register(authServiceDecorator);
        await app.ready();

        /** Assert */
        // Check if the decorator exists
        expect(app.hasDecorator("authService")).toBe(true);

        // Ensure the decorated value is defined
        const authService = (app as any).authService;
        expect(authService).toBeDefined();

        expect(AuthService).toHaveBeenCalled();
    });
});
