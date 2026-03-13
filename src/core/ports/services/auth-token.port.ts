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

export interface RecoveryPayload {
    sub: string;
    purpose: string;
}

export interface AuthTokenPort {
    generate(payload: UserPayload): TokenResult;
    verify(token: string): UserPayload;
    hashRefreshSecret(secret: string): string;
    generateRecoveryToken(userId: string): string;
    verifyRecoveryToken(token: string): RecoveryPayload;
}
