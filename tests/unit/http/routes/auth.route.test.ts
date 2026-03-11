import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mocked,
    Mock,
} from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { authRoutes } from "@routes/auth.route";
import type { AuthService } from "@services/auth.service";

describe("Auth Routes", () => {
    let app: FastifyInstance;
    let mockAuthService: Mocked<AuthService>;

    // Cookie method spies
    let setCookieSpy: Mock;
    let clearCookieSpy: Mock;
    let unsignCookieSpy: Mock;

    const SYSTEM_TIME = new Date("2026-03-10T12:00:00.000Z");

    beforeEach(async () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(SYSTEM_TIME);
        setCookieSpy = vi.fn();
        clearCookieSpy = vi.fn();
        unsignCookieSpy = vi
            .fn()
            .mockReturnValue({ valid: true, value: "valid_unsigned_token" });

        mockAuthService = {
            register: vi.fn(),
            login: vi.fn(),
            refresh: vi.fn(),
            logout: vi.fn(),
            sendVerificationEmail: vi.fn(),
            verifyEmail: vi.fn(),
            forgotPassword: vi.fn(),
            resetPassword: vi.fn(),
        } as unknown as Mocked<AuthService>;

        app = Fastify();

        // 1. Decorate app with our mock service and config
        app.decorate("authService", mockAuthService);
        app.decorate("config", { NODE_ENV: "test" } as any);

        // 2. Mock authenticate middleware (simulating a logged-in user)
        app.decorate("authenticate", async (request: any) => {
            request.user = { id: "user-123" };
        });

        // 3. Mock Reply Cookie Methods
        app.decorateReply(
            "setCookie",
            function (name: string, value: string, options: any) {
                setCookieSpy(name, value, options);
                return this; // Allow chaining if needed
            },
        );

        app.decorateReply("clearCookie", function (name: string, options: any) {
            clearCookieSpy(name, options);
            return this;
        });

        // 4. Mock Request Cookie Methods & populate req.cookies from headers
        app.decorateRequest("cookies", null as any);
        app.decorateRequest("unsignCookie", function (rawCookie: string) {
            return unsignCookieSpy(rawCookie);
        });

        app.addHook("onRequest", async (req) => {
            req.cookies = {};
            const cookieHeader = req.headers.cookie;
            if (cookieHeader && cookieHeader.includes("refreshToken=")) {
                req.cookies.refreshToken =
                    cookieHeader.split("refreshToken=")[1];
            }
        });

        // Register the routes plugin
        await app.register(authRoutes);
        await app.ready();
    });

    afterEach(async () => {
        vi.useRealTimers();
        vi.clearAllMocks();
        await app.close();
    });

    describe("POST /register", () => {
        it("Should register a user and return 201 Created with data and meta.", async () => {
            /** Arrange */
            const payload = {
                email: "test@example.com",
                username: "testuser",
                password: "SecurePassword123!",
            };

            const mockUser = {
                id: "user-123",
                username: "testuser",
                createdAt: SYSTEM_TIME,
            };

            mockAuthService.register.mockResolvedValue(mockUser as any);

            /** Act */
            const response = await app.inject({
                method: "POST",
                url: "/register",
                payload,
            });

            /** Assert */
            expect(response.statusCode).toBe(201);
            expect(mockAuthService.register).toHaveBeenCalledWith(payload);

            const body = response.json();
            expect(body.data.id).toBe(mockUser.id);
            expect(body.data.username).toBe(mockUser.username);
            expect(body.data.createdAt).toBe(SYSTEM_TIME.toISOString());
            expect(body.meta.timestamp).toBe(SYSTEM_TIME.toISOString());
        });
    });

    describe("POST /login", () => {
        it("Should login a user, set httpOnly cookie, and return 200 OK.", async () => {
            /** Arrange */
            const payload = {
                identifier: "test@example.com",
                password: "SecurePassword123!",
            };

            const mockLoginOutput = {
                accessToken: "jwt_access_token",
                expiresAt: 1234567890,
                refreshToken: "raw_refresh_token",
                refreshTokenExpiresAt: new Date("2026-04-10T12:00:00.000Z"),
                user: { id: "user-123", username: "testuser" },
            };

            mockAuthService.login.mockResolvedValue(mockLoginOutput);

            /** Act */
            const response = await app.inject({
                method: "POST",
                url: "/login",
                payload,
                headers: {
                    "user-agent": "TestAgent/1.0",
                },
            });

            /** Assert */
            expect(response.statusCode).toBe(200);

            // Validate Use Case call
            expect(mockAuthService.login).toHaveBeenCalledWith({
                ...payload,
                deviceIp: "127.0.0.1", // Default injected IP
                userAgent: "TestAgent/1.0",
            });

            // Validate Cookie configuration
            expect(setCookieSpy).toHaveBeenCalledWith(
                "refreshToken",
                mockLoginOutput.refreshToken,
                {
                    path: "/",
                    httpOnly: true,
                    secure: false, // NODE_ENV === "test", not "production"
                    sameSite: "strict",
                    expires: mockLoginOutput.refreshTokenExpiresAt,
                    signed: true,
                },
            );

            // Validate Response Body
            const body = response.json();
            expect(body.data.accessToken).toBe(mockLoginOutput.accessToken);
            expect(body.data.user.id).toBe(mockLoginOutput.user.id);
            expect(body.meta.timestamp).toBe(SYSTEM_TIME.toISOString());
        });
    });

    describe("POST /refresh", () => {
        it("Should refresh token, set new cookie, and return 200 OK.", async () => {
            /** Arrange */
            const mockRefreshOutput = {
                accessToken: "new_jwt_access_token",
                expiresAt: 1234567890,
                refreshToken: "new_raw_refresh_token",
                refreshTokenExpiresAt: new Date("2026-04-10T12:00:00.000Z"),
                user: { id: "user-123", username: "testuser" },
            };

            mockAuthService.refresh.mockResolvedValue(mockRefreshOutput);

            /** Act */
            const response = await app.inject({
                method: "POST",
                url: "/refresh",
                headers: {
                    cookie: "refreshToken=raw_cookie_value",
                    "user-agent": "TestAgent/1.0",
                },
            });

            /** Assert */
            expect(response.statusCode).toBe(200);
            expect(unsignCookieSpy).toHaveBeenCalledWith("raw_cookie_value");
            expect(mockAuthService.refresh).toHaveBeenCalledWith({
                token: "valid_unsigned_token",
                deviceIp: "127.0.0.1",
                userAgent: "TestAgent/1.0",
            });
            expect(setCookieSpy).toHaveBeenCalledTimes(1);
        });

        it("Should fail if refresh cookie is missing.", async () => {
            /** Act */
            const response = await app.inject({
                method: "POST",
                url: "/refresh",
                // No cookie header
            });

            /** Assert */
            // Should return 500 or Fastify's default error handler format since UnauthorizedError is thrown
            expect(response.statusCode).toBeGreaterThanOrEqual(400);
            expect(mockAuthService.refresh).not.toHaveBeenCalled();
        });
    });

    describe("POST /logout", () => {
        it("Should logout user, clear cookie, and return 204 No Content.", async () => {
            /** Arrange */
            mockAuthService.logout.mockResolvedValue(undefined);

            /** Act */
            const response = await app.inject({
                method: "POST",
                url: "/logout",
                headers: {
                    cookie: "refreshToken=raw_cookie_value",
                },
            });

            /** Assert */
            expect(response.statusCode).toBe(204);
            expect(response.body).toBe(""); // 204 has no body

            expect(mockAuthService.logout).toHaveBeenCalledWith({
                token: "valid_unsigned_token",
            });

            expect(clearCookieSpy).toHaveBeenCalledWith("refreshToken", {
                path: "/",
                httpOnly: true,
                secure: false,
                sameSite: "strict",
                signed: true,
            });
        });
    });

    describe("POST /send-verification", () => {
        it("Should trigger verification email and return 200 OK.", async () => {
            /** Arrange */
            mockAuthService.sendVerificationEmail.mockResolvedValue(undefined);

            /** Act */
            const response = await app.inject({
                method: "POST",
                url: "/send-verification",
            });

            /** Assert */
            expect(response.statusCode).toBe(200);

            // "user-123" comes from our mocked authenticate middleware
            expect(mockAuthService.sendVerificationEmail).toHaveBeenCalledWith({
                userId: "user-123",
            });

            const body = response.json();
            expect(body.data.sent).toBe(true);
        });
    });

    describe("POST /verify-email", () => {
        it("Should verify email via OTP and return 200 OK.", async () => {
            /** Arrange */
            const payload = { otp: "12345678" };
            mockAuthService.verifyEmail.mockResolvedValue(undefined);

            /** Act */
            const response = await app.inject({
                method: "POST",
                url: "/verify-email",
                payload,
            });

            /** Assert */
            expect(response.statusCode).toBe(200);
            expect(mockAuthService.verifyEmail).toHaveBeenCalledWith({
                userId: "user-123", // From mock middleware
                otp: payload.otp,
            });
            expect(response.json().data.verified).toBe(true);
        });
    });

    describe("POST /forgot-password", () => {
        it("Should trigger forgot password flow and return 204 No Content.", async () => {
            /** Arrange */
            const payload = { email: "test@example.com" };
            mockAuthService.forgotPassword.mockResolvedValue(undefined);

            /** Act */
            const response = await app.inject({
                method: "POST",
                url: "/forgot-password",
                payload,
            });

            /** Assert */
            expect(response.statusCode).toBe(204);
            expect(mockAuthService.forgotPassword).toHaveBeenCalledWith({
                email: payload.email,
            });
        });
    });

    describe("POST /reset-password", () => {
        it("Should reset password and return 200 OK.", async () => {
            /** Arrange */
            const payload = {
                email: "test@example.com",
                otp: "12345678",
                newPassword: "NewSecurePassword123!",
            };
            mockAuthService.resetPassword.mockResolvedValue(undefined);

            /** Act */
            const response = await app.inject({
                method: "POST",
                url: "/reset-password",
                payload,
            });

            /** Assert */
            expect(response.statusCode).toBe(200);
            expect(mockAuthService.resetPassword).toHaveBeenCalledWith(payload);
            expect(response.json().data.reset).toBe(true);
        });
    });
});
