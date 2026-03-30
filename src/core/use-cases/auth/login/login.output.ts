export interface LoginOutput {
    user: {
        id: string;
        username: string;
        isEmailVerified: boolean;
    };
    tokens: {
        accessToken: string;
        expiresAt: number;
        refreshToken: string;
        refreshTokenExpiresAt: Date;
    };
}
