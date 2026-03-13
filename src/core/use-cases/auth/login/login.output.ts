import type { UserPayload } from "@core/ports/services/auth-token.port";

export interface LoginOutput {
    accessToken: string;
    expiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    user: UserPayload;
}
