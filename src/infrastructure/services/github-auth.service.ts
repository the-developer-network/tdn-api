import OAuthProviderError from "@core/errors/oauth-provider.error.ts";
import type {
    GithubAuthPort,
    GithubProfile,
} from "@core/ports/services/github-auth.port";
import axios from "axios";

export interface GithubAuthConfig {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
}

export class GithubAuthService implements GithubAuthPort {
    constructor(private readonly config: GithubAuthConfig) {}

    getAuthorizationUrl(): string {
        const rootUrl = "https://github.com/login/oauth/authorize";

        const options = {
            client_id: this.config.clientId,
            redirect_uri: this.config.callbackUrl,
            scope: "user:email",
        };

        const qs = new URLSearchParams(options);
        return `${rootUrl}?${qs.toString()}`;
    }

    async getUserProfileByCode(code: string): Promise<GithubProfile> {
        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                code,
                redirect_uri: this.config.callbackUrl,
            },
            { headers: { Accept: "application/json" } },
        );

        const accessToken = tokenResponse.data.access_token;

        if (!accessToken) {
            throw new OAuthProviderError("Github profile fetch failed.");
        }

        const userResponse = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const githubUser = userResponse.data;

        return {
            providerAccountId: githubUser.id.toString(),
            username: githubUser.login,
            email: githubUser.email,
        };
    }
}
