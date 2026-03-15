export interface GoogleProfile {
    providerAccountId: string;
    email: string;
    username: string;
}

export interface GoogleAuthPort {
    getAuthorizationUrl(): string;
    getUserProfileByCode(code: string): Promise<GoogleProfile>;
}
