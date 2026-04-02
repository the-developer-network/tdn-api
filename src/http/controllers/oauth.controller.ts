import { BaseAuthController } from "./base-auth.controller";
import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import type { GithubAuthPort } from "@core/ports/services/github-auth.port";
import { AccountPendingDeletionError } from "@core/errors";
import type { GithubLoginUseCase } from "@core/use-cases/oauth/oauth-github";
import type { GoogleAuthService } from "@infrastructure/external/google-auth.service";
import type { GoogleLoginUseCase } from "@core/use-cases/oauth/oauth-google";

export class OAuthController extends BaseAuthController {
    constructor(
        private readonly githubAuthService: GithubAuthPort,
        private readonly githubLoginUseCase: GithubLoginUseCase,
        private readonly googleAuthService: GoogleAuthService,
        private readonly googleLoginUseCase: GoogleLoginUseCase,
        config: FastifyInstance["config"],
    ) {
        super(config);
    }

    private get frontendUrl(): string {
        return this.config.NODE_ENV === "production"
            ? "https://developernetwork.net"
            : "http://localhost:5173";
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

        if (error) {
            return reply.redirect(
                `${this.frontendUrl}/login?error=github_access_denied`,
            );
        }

        if (!code) {
            return reply.redirect(
                `${this.frontendUrl}/login?error=missing_code`,
            );
        }

        try {
            const response = await this.githubLoginUseCase.execute({
                code,
                deviceIp: request.ip,
                userAgent: request.headers["user-agent"] ?? "Unknown Device",
            });

            reply.redirect(
                `${this.frontendUrl}/oauth-success?token=${response.tokens.accessToken}&refreshToken=${response.tokens.refreshToken}`,
            );
        } catch (err: unknown) {
            if (err instanceof AccountPendingDeletionError) {
                return reply.redirect(
                    `${this.frontendUrl}/oauth-success?error=account_pending_deletion&recoveryToken=${err.recoveryToken}`,
                );
            }

            reply.redirect(
                `${this.frontendUrl}/oauth-success?error=oauth_failed`,
            );
        }
    }

    google(_request: FastifyRequest, reply: FastifyReply): void {
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

        if (error) {
            return reply.redirect(
                `${this.frontendUrl}/login?error=google_access_denied`,
            );
        }

        if (!code) {
            return reply.redirect(
                `${this.frontendUrl}/login?error=missing_code`,
            );
        }

        try {
            const response = await this.googleLoginUseCase.execute({
                code,
                deviceIp: request.ip,
                userAgent: request.headers["user-agent"] ?? "Unknown Device",
            });

            reply.redirect(
                `${this.frontendUrl}/oauth-success?token=${response.tokens.accessToken}&refreshToken=${response.tokens.refreshToken}`,
            );
        } catch (err: unknown) {
            if (err instanceof AccountPendingDeletionError) {
                return reply.redirect(
                    `${this.frontendUrl}/oauth-success?error=account_pending_deletion&recoveryToken=${err.recoveryToken}`,
                );
            }

            reply.redirect(
                `${this.frontendUrl}/oauth-success?error=oauth_failed`,
            );
        }
    }
}
