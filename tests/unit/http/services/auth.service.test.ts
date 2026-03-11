import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type Mocked,
} from "vitest";
import { AuthService } from "@services/auth.service";

import type {
    RegisterUseCase,
    RegisterInput,
} from "@core/use-cases/auth/register.usecase";
import type {
    LoginUseCase,
    LoginInput,
    LoginOutput,
} from "@core/use-cases/auth/login.usecase";
import type {
    RefreshUseCase,
    RefreshInput,
    RefreshOutput,
} from "@core/use-cases/auth/refresh.usecase";
import type {
    LogoutUseCase,
    LogoutInput,
} from "@core/use-cases/auth/logout.usecase";
import type {
    SendVerificationEmailUseCase,
    SendVerificationEmailInput,
} from "@core/use-cases/auth/send-verification-email.usecase";
import type {
    VerifyEmailUseCase,
    VerifyEmailInput,
} from "@core/use-cases/auth/verify-email.usecase";
import type {
    ForgotPasswordUseCase,
    ForgotPasswordInput,
} from "@core/use-cases/auth/forgot-password.usecase";
import type {
    ResetPasswordUseCase,
    ResetPasswordInput,
} from "@core/use-cases/auth/reset-password.usecase";

describe("Auth Service (Facade)", () => {
    let authService: AuthService;

    let mockRegisterUseCase: Mocked<RegisterUseCase>;
    let mockLoginUseCase: Mocked<LoginUseCase>;
    let mockRefreshUseCase: Mocked<RefreshUseCase>;
    let mockLogoutUseCase: Mocked<LogoutUseCase>;
    let mockSendVerificationEmailUseCase: Mocked<SendVerificationEmailUseCase>;
    let mockVerifyEmailUseCase: Mocked<VerifyEmailUseCase>;
    let mockForgotPasswordUseCase: Mocked<ForgotPasswordUseCase>;
    let mockResetPasswordUseCase: Mocked<ResetPasswordUseCase>;

    beforeEach(() => {
        mockRegisterUseCase = {
            execute: vi.fn(),
        } as unknown as Mocked<RegisterUseCase>;
        mockLoginUseCase = {
            execute: vi.fn(),
        } as unknown as Mocked<LoginUseCase>;
        mockRefreshUseCase = {
            execute: vi.fn(),
        } as unknown as Mocked<RefreshUseCase>;
        mockLogoutUseCase = {
            execute: vi.fn(),
        } as unknown as Mocked<LogoutUseCase>;
        mockSendVerificationEmailUseCase = {
            execute: vi.fn(),
        } as unknown as Mocked<SendVerificationEmailUseCase>;
        mockVerifyEmailUseCase = {
            execute: vi.fn(),
        } as unknown as Mocked<VerifyEmailUseCase>;
        mockForgotPasswordUseCase = {
            execute: vi.fn(),
        } as unknown as Mocked<ForgotPasswordUseCase>;
        mockResetPasswordUseCase = {
            execute: vi.fn(),
        } as unknown as Mocked<ResetPasswordUseCase>;

        authService = new AuthService(
            mockRegisterUseCase,
            mockLoginUseCase,
            mockRefreshUseCase,
            mockLogoutUseCase,
            mockSendVerificationEmailUseCase,
            mockVerifyEmailUseCase,
            mockForgotPasswordUseCase,
            mockResetPasswordUseCase,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("register()", () => {
        it("Should delegate the call to RegisterUseCase and return the user.", async () => {
            /** Arrange */
            const input: RegisterInput = {
                email: "test@example.com",
                username: "test",
                password: "pwd",
            };
            const expectedUser = { id: "1" } as any;
            mockRegisterUseCase.execute.mockResolvedValue(expectedUser);

            /** Act */
            const result = await authService.register(input);

            /** Assert */
            expect(mockRegisterUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedUser);
        });
    });

    describe("login()", () => {
        it("Should delegate the call to LoginUseCase and return the output.", async () => {
            /** Arrange */
            const input: LoginInput = {
                identifier: "test",
                password: "pwd",
                userAgent: "ua",
                deviceIp: "127.0.0.1",
            };
            const expectedOutput: LoginOutput = { accessToken: "token" } as any;
            mockLoginUseCase.execute.mockResolvedValue(expectedOutput);

            /** Act */
            const result = await authService.login(input);

            /** Assert */
            expect(mockLoginUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockLoginUseCase.execute).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedOutput);
        });
    });

    describe("refresh()", () => {
        it("Should delegate the call to RefreshUseCase and return the output.", async () => {
            /** Arrange */
            const input: RefreshInput = {
                token: "refresh",
                deviceIp: "ip",
                userAgent: "ua",
            };
            const expectedOutput: RefreshOutput = {
                accessToken: "new_token",
            } as any;
            mockRefreshUseCase.execute.mockResolvedValue(expectedOutput);

            /** Act */
            const result = await authService.refresh(input);

            /** Assert */
            expect(mockRefreshUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockRefreshUseCase.execute).toHaveBeenCalledWith(input);
            expect(result).toBe(expectedOutput);
        });
    });

    describe("logout()", () => {
        it("Should delegate the call to LogoutUseCase.", async () => {
            /** Arrange */
            const input: LogoutInput = { token: "refresh_token" };
            mockLogoutUseCase.execute.mockResolvedValue(undefined);

            /** Act */
            await authService.logout(input);

            /** Assert */
            expect(mockLogoutUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockLogoutUseCase.execute).toHaveBeenCalledWith(input);
        });
    });

    describe("sendVerificationEmail()", () => {
        it("Should delegate the call to SendVerificationEmailUseCase.", async () => {
            /** Arrange */
            const input: SendVerificationEmailInput = { userId: "user-1" };
            mockSendVerificationEmailUseCase.execute.mockResolvedValue(
                undefined,
            );

            /** Act */
            await authService.sendVerificationEmail(input);

            /** Assert */
            expect(
                mockSendVerificationEmailUseCase.execute,
            ).toHaveBeenCalledTimes(1);
            expect(
                mockSendVerificationEmailUseCase.execute,
            ).toHaveBeenCalledWith(input);
        });
    });

    describe("verifyEmail()", () => {
        it("Should delegate the call to VerifyEmailUseCase.", async () => {
            /** Arrange */
            const input: VerifyEmailInput = { userId: "user-1", otp: "123456" };
            mockVerifyEmailUseCase.execute.mockResolvedValue(undefined);

            /** Act */
            await authService.verifyEmail(input);

            /** Assert */
            expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledWith(input);
        });
    });

    describe("forgotPassword()", () => {
        it("Should delegate the call to ForgotPasswordUseCase.", async () => {
            /** Arrange */
            const input: ForgotPasswordInput = { email: "test@example.com" };
            mockForgotPasswordUseCase.execute.mockResolvedValue(undefined);

            /** Act */
            await authService.forgotPassword(input);

            /** Assert */
            expect(mockForgotPasswordUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockForgotPasswordUseCase.execute).toHaveBeenCalledWith(
                input,
            );
        });
    });

    describe("resetPassword()", () => {
        it("Should delegate the call to ResetPasswordUseCase.", async () => {
            /** Arrange */
            const input: ResetPasswordInput = {
                email: "test@example.com",
                otp: "123456",
                newPassword: "pwd",
            };
            mockResetPasswordUseCase.execute.mockResolvedValue(undefined);

            /** Act */
            await authService.resetPassword(input);

            /** Assert */
            expect(mockResetPasswordUseCase.execute).toHaveBeenCalledTimes(1);
            expect(mockResetPasswordUseCase.execute).toHaveBeenCalledWith(
                input,
            );
        });
    });
});
