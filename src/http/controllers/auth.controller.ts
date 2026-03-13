import { UnauthorizedError } from "@core/errors/unauthorized.error";
import type { ForgotPasswordUseCase } from "@core/use-cases/auth/forgot-password/forgot-password.usecase";
import type { LoginUseCase } from "@core/use-cases/auth/login/login.usecase";
import type { LogoutUseCase } from "@core/use-cases/auth/logout/logout.usecase";
import type { RecoverAccountUseCase } from "@core/use-cases/auth/recover-account/recover-account.usecase";
import type { RefreshUseCase } from "@core/use-cases/auth/refresh/refresh.usecase";
import type { RegisterUseCase } from "@core/use-cases/auth/register/register.usecase";
import type { ResetPasswordUseCase } from "@core/use-cases/auth/reset-password/reset-password.usecase";
import type { SendVerificationEmailUseCase } from "@core/use-cases/auth/send-verification-email/send-verification-email.usecase";
import type { VerifyEmailUseCase } from "@core/use-cases/auth/verify-email/verify-email.usecase";
import type { ForgotPasswordBody } from "@typings/schemas/auth/forgot-password.schema";
import type { LoginBody } from "@typings/schemas/auth/login.schema";
import type { RecoverAccountBody } from "@typings/schemas/auth/recover-account.schema";
import type { RegisterBody } from "@typings/schemas/auth/register.schema";
import type { ResetPasswordBody } from "@typings/schemas/auth/reset-password.schema";
import type { VerifyEmailBody } from "@typings/schemas/auth/verify-email.schema";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default class AuthController {
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
        private readonly fastify: FastifyInstance,
    ) {}

    private get isProduction(): boolean {
        return this.fastify.config.NODE_ENV === "production";
    }

    private dateToMaxAge(date: Date): number {
        return Math.floor((date.getTime() - Date.now()) / 1000);
    }

    private setRefreshTokenCookie(
        reply: FastifyReply,
        token: string,
        maxAge: number | Date,
        path: string = "/",
    ): void {
        reply.setCookie("refreshToken", token, {
            path,
            httpOnly: true,
            secure: this.isProduction,
            sameSite: "strict",
            maxAge: maxAge instanceof Date ? this.dateToMaxAge(maxAge) : maxAge,
            signed: true,
        });
    }

    private clearRefreshTokenCookie(reply: FastifyReply): void {
        reply.clearCookie("refreshToken", {
            path: "/",
            httpOnly: true,
            secure: this.isProduction,
            sameSite: "strict",
            signed: true,
        });
    }

    private unsignRefreshToken(request: FastifyRequest): string | null {
        const rawCookie = request.cookies.refreshToken;

        if (!rawCookie) return null;

        const unsigned = request.unsignCookie(rawCookie);

        return unsigned.valid && unsigned.value ? unsigned.value : null;
    }

    async register(
        request: FastifyRequest<{ Body: RegisterBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const user = await this.registerUseCase.execute({
            email: request.body.email,
            username: request.body.username,
            password: request.body.password,
        });

        reply.status(201).send({
            data: {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt.toISOString(),
            },
            meta: { timestamp: new Date().toISOString() },
        });
    }

    async login(
        request: FastifyRequest<{ Body: LoginBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const response = await this.loginUseCase.execute({
            identifier: request.body.identifier,
            password: request.body.password,
            deviceIp: request.ip,
            userAgent: request.headers["user-agent"] ?? "Unknown Device",
        });

        this.setRefreshTokenCookie(
            reply,
            response.refreshToken,
            response.refreshTokenExpiresAt,
        );

        reply.status(200).send({
            data: {
                accessToken: response.accessToken,
                expiresAt: response.expiresAt,
                user: response.user,
            },
            meta: { timestamp: new Date().toISOString() },
        });
    }

    async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const token = this.unsignRefreshToken(request);

        if (!token) {
            throw new UnauthorizedError("Authentication session not found");
        }

        const response = await this.refreshUseCase.execute({
            token,
            deviceIp: request.ip,
            userAgent: request.headers["user-agent"] ?? "Unknown Device",
        });

        this.setRefreshTokenCookie(
            reply,
            response.refreshToken,
            response.refreshTokenExpiresAt,
        );

        reply.status(200).send({
            data: {
                accessToken: response.accessToken,
                expiresAt: response.expiresAt,
                user: response.user,
            },
            meta: { timestamp: new Date().toISOString() },
        });
    }

    async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const token = this.unsignRefreshToken(request);

        if (token) {
            await this.logoutUseCase.execute({ token });
        }

        this.clearRefreshTokenCookie(reply);

        reply.status(204).send();
    }

    async sendVerification(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        await this.sendVerificationEmailUseCase.execute({
            userId: request.user.id,
        });

        reply.status(200).send({
            data: { sent: true },
            meta: { timestamp: new Date().toISOString() },
        });
    }

    async verifyEmail(
        request: FastifyRequest<{ Body: VerifyEmailBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        await this.verifyEmailUseCase.execute({
            userId: request.user.id,
            otp: request.body.otp,
        });

        reply.status(200).send({
            data: { verified: true },
            meta: { timestamp: new Date().toISOString() },
        });
    }

    async forgotPassword(
        request: FastifyRequest<{ Body: ForgotPasswordBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        await this.forgotPasswordUseCase.execute({
            email: request.body.email,
        });

        reply.status(204).send();
    }

    async resetPassword(
        request: FastifyRequest<{ Body: ResetPasswordBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        await this.resetPasswordUseCase.execute({
            email: request.body.email,
            otp: request.body.otp,
            newPassword: request.body.newPassword,
        });

        reply.status(200).send({
            data: { reset: true },
            meta: { timestamp: new Date().toISOString() },
        });
    }

    async recoverAccount(
        request: FastifyRequest<{ Body: RecoverAccountBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const response = await this.recoverAccountUseCase.execute({
            recoveryToken: request.body.recoveryToken,
        });

        this.setRefreshTokenCookie(
            reply,
            response.refreshToken,
            this.fastify.config.REFRESH_TOKEN_EXPIRES_IN,
            "/auth/refresh",
        );

        reply.status(200).send({
            data: {
                accessToken: response.accessToken,
                expiresAt: response.expiresAt,
                user: {
                    id: response.user.id,
                    username: response.user.username,
                },
            },
            meta: { timestamp: new Date().toISOString() },
        });
    }
}
