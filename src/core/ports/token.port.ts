export interface UserPayload {
    id: string;
    username: string;
}

export interface TokenResult {
    accessToken: string;
    expiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
}

export interface TokenPort {
    generate(payload: UserPayload): TokenResult;
    verify(token: string): UserPayload;

    hashRefreshSecret(secret: string): string;
    compareRefreshSecret(secret: string, hashedSecret: string): boolean;
}
