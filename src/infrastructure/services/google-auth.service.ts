import OAuthProviderError from "@core/errors/oauth-provider.error.ts";

import type {
    GoogleAuthPort,
    GoogleProfile,
} from "@core/ports/services/google-auth.port";

export interface GoogleAuthConfig {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
}

export class GoogleAuthService implements GoogleAuthPort {
    constructor(private readonly config: GoogleAuthConfig) {}

    getAuthorizationUrl(): string {
        const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const options = {
            redirect_uri: this.config.callbackUrl,
            client_id: this.config.clientId,
            access_type: "offline",
            response_type: "code",
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ].join(" "),
        };

        const qs = new URLSearchParams(options);
        return `${rootUrl}?${qs.toString()}`;
    }

    async getUserProfileByCode(code: string): Promise<GoogleProfile> {
        const tokenUrl = "https://oauth2.googleapis.com/token";
        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uri: this.config.callbackUrl,
                grant_type: "authorization_code",
            }).toString(),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            throw new OAuthProviderError(
                `Google token exchange failed: ${error}`,
            );
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const userUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

        const userResponse = await fetch(userUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userResponse.ok) {
            throw new OAuthProviderError("Failed to fetch Google user profile");
        }

        const googleUser = await userResponse.json();

        const derivedUsername = googleUser.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "");

        return {
            email: googleUser.email,
            username: derivedUsername,
            providerAccountId: googleUser.id,
        };
    }
}
