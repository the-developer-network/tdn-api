import type { UserPayload } from "@core/ports/services/auth-token.port";

export interface RefreshOutput {
    accessToken: string;
    expiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    user: UserPayload;
}
