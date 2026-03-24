import { asClass, asFunction } from "awilix";
import { EmailService } from "@infrastructure/external/email.service";
import { GithubAuthService } from "@infrastructure/external/github-auth.service";
import { GoogleAuthService } from "@infrastructure/external/google-auth.service";
import { S3StorageService } from "@infrastructure/external/s3-storage.service";

export const externalModule = {
    // --- Services ---
    storageService: asClass(S3StorageService).singleton(),
    emailService: asFunction((config, logger) => {
        return new EmailService(
            {
                host: config.SMTP_HOST,
                port: config.SMTP_PORT,
                secure: config.SMTP_SECURE,
                user: config.SMTP_USER,
                pass: config.SMTP_PASS,
                from: config.EMAIL_FROM,
            },
            logger,
        );
    }).singleton(),

    githubAuthService: asFunction((config) => {
        return new GithubAuthService({
            clientId: config.GITHUB_CLIENT_ID,
            clientSecret: config.GITHUB_CLIENT_SECRET,
            callbackUrl: config.GITHUB_CALLBACK_URL,
        });
    }).singleton(),

    googleAuthService: asFunction((config) => {
        return new GoogleAuthService({
            clientId: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_CLIENT_SECRET,
            callbackUrl: config.GOOGLE_CALLBACK_URL,
        });
    }).singleton(),
};
