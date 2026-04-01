import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";

const PRODUCTION_DOMAIN = ".developernetwork.net";

export abstract class BaseAuthController {
    constructor(protected readonly config: FastifyInstance["config"]) {}

    protected get isProduction(): boolean {
        return this.config.NODE_ENV === "production";
    }

    protected dateToMaxAge(date: Date): number {
        return Math.floor((date.getTime() - Date.now()) / 1000);
    }

    protected setRefreshTokenCookie(
        reply: FastifyReply,
        token: string,
        maxAge: number | Date,
        path: string = "/",
    ): void {
        reply.setCookie("refreshToken", token, {
            path,
            httpOnly: true,
            secure: this.isProduction,
            sameSite: this.isProduction ? "none" : "strict",
            domain: this.isProduction ? PRODUCTION_DOMAIN : undefined,
            maxAge: maxAge instanceof Date ? this.dateToMaxAge(maxAge) : maxAge,
            signed: true,
        });
    }

    protected clearRefreshTokenCookie(reply: FastifyReply): void {
        reply.clearCookie("refreshToken", {
            path: "/",
            httpOnly: true,
            secure: this.isProduction,
            sameSite: this.isProduction ? "none" : "strict",
            domain: this.isProduction ? PRODUCTION_DOMAIN : undefined,
            signed: true,
        });
    }

    protected unsignRefreshToken(request: FastifyRequest): string | null {
        const rawCookie = request.cookies.refreshToken;

        if (!rawCookie) return null;

        const unsigned = request.unsignCookie(rawCookie);

        return unsigned.valid && unsigned.value ? unsigned.value : null;
    }
}
