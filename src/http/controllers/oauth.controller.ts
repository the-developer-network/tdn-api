import { BaseAuthController } from "./base-auth.controller";
import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import type { GithubAuthPort } from "@core/ports/services/github-auth.port";
import { AccountPendingDeletionError } from "@core/errors";
import type { GithubLoginUseCase } from "@core/use-cases/oauth/oauth-github";
import type { GoogleAuthService } from "@infrastructure/services/google-auth.service";
import type { GoogleLoginUseCase } from "@core/use-cases/oauth/oauth-google";

export default class OAuthController extends BaseAuthController {
    constructor(
        private readonly githubAuthService: GithubAuthPort,
        private readonly githubLoginUseCase: GithubLoginUseCase,
        private readonly googleAuthService: GoogleAuthService,
        private readonly googleLoginUseCase: GoogleLoginUseCase,
        config: FastifyInstance["config"],
    ) {
        super(config);
    }

    github(_request: FastifyRequest, reply: FastifyReply): void {
        const url = this.githubAuthService.getAuthorizationUrl();
        reply.redirect(url);
    }

    async githubCallback(
        request: FastifyRequest<{
            Querystring: { code?: string; error?: string };
        }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { code, error } = request.query;
        const frontendUrl = this.config.CORS_ORIGIN;

        if (error) {
            return reply.redirect(
                `${frontendUrl}/login?error=github_access_denied`,
            );
        }

        if (!code) {
            return reply.redirect(`${frontendUrl}/login?error=missing_code`);
        }

        try {
            const response = await this.githubLoginUseCase.execute({
                code,
                deviceIp: request.ip,
                userAgent: request.headers["user-agent"] ?? "Unknown Device",
            });

            this.setRefreshTokenCookie(
                reply,
                response.refreshToken,
                response.refreshTokenExpiresAt,
                "/auth/refresh",
            );

            reply.redirect(
                `${frontendUrl}/oauth-success?token=${response.accessToken}`,
            );
        } catch (err: unknown) {
            if (err instanceof AccountPendingDeletionError) {
                return reply.redirect(
                    `${frontendUrl}/recover-account?token=${err.recoveryToken}`,
                );
            }

            reply.redirect(`${frontendUrl}/login?error=oauth_failed`);
        }
    }

    google(request: FastifyRequest, reply: FastifyReply): void {
        const url = this.googleAuthService.getAuthorizationUrl();
        reply.redirect(url);
    }

    async googleCallback(
        request: FastifyRequest<{
            Querystring: { code?: string; error?: string };
        }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { code, error } = request.query;
        const frontendUrl = this.config.CORS_ORIGIN;

        if (error) {
            return reply.redirect(
                `${frontendUrl}/login?error=google_access_denied`,
            );
        }

        if (!code) {
            return reply.redirect(`${frontendUrl}/login?error=missing_code`);
        }

        try {
            const response = await this.googleLoginUseCase.execute({
                code,
                deviceIp: request.ip,
                userAgent: request.headers["user-agent"] ?? "Unknown Device",
            });

            this.setRefreshTokenCookie(
                reply,
                response.refreshToken,
                response.refreshTokenExpiresAt,
                "/auth/refresh",
            );

            reply.redirect(
                `${frontendUrl}/oauth-success?token=${response.accessToken}`,
            );
        } catch (err: unknown) {
            if (err instanceof AccountPendingDeletionError) {
                return reply.redirect(
                    `${frontendUrl}/recover-account?token=${err.recoveryToken}`,
                );
            }

            reply.redirect(`${frontendUrl}/login?error=oauth_failed`);
        }
    }
}
