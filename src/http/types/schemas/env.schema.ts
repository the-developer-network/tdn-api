import { Type, type Static } from "@sinclair/typebox";

export const EnvSchema = Type.Object({
    PORT: Type.Number({ default: 3000 }),
    NODE_ENV: Type.Union([
        Type.Literal("development"),
        Type.Literal("test"),
        Type.Literal("production"),
    ]),
    DATABASE_URL: Type.String(),
    ACCESS_TOKEN_SECRET_KEY: Type.String(),
    COOKIE_SECRET: Type.String(),

    // --- Authentication & Tokens ---
    ACCESS_TOKEN_EXPIRES_IN: Type.Number({ default: 900 }),
    REFRESH_TOKEN_EXPIRES_IN: Type.Number({ default: 90000 }),

    REFRESH_TOKEN_PURGE_CRON: Type.String({ default: "0 */6 * * *" }),
    REFRESH_TOKEN_PURGE_GRACE_PERIOD_DAYS: Type.Number({ default: 24 }),

    // --- SMTP & Email Configuration ---
    SMTP_HOST: Type.String({ default: "sdasa" }),
    SMTP_PORT: Type.Number({ default: 2525 }),
    SMTP_SECURE: Type.Boolean({ default: false }),
    SMTP_USER: Type.String({ default: "user" }),
    SMTP_PASS: Type.String({ default: "123" }),
    EMAIL_FROM: Type.String({ default: "email" }),

    // --- Others ---
    CORS_ORIGIN: Type.String({ default: "http://localhost:3000" }),

    // Github Configration
    GITHUB_CLIENT_ID: Type.String(),
    GITHUB_CLIENT_SECRET: Type.String(),
    GITHUB_CALLBACK_URL: Type.String({
        default: "http://localhost:8080/api/v1/oauth/google/callback",
    }),

    //Google Configration
    GOOGLE_CLIENT_ID: Type.String(),
    GOOGLE_CLIENT_SECRET: Type.String(),
    GOOGLE_CALLBACK_URL: Type.String({
        default: "http://localhost:8080/api/v1/oauth/google/callback",
    }),

    // User Purge Cleanup Configration
    USER_PURGE_GRACE_PERIOD_DAYS: Type.Number({ default: 30 }),
    USER_PURGE_CRON: Type.String({ default: "0 3 * * *" }),

    // R2 Configration
    R2_BUCKET_NAME: Type.String({ default: "tdn" }),
    R2_ACCESS_KEY_ID: Type.String({ default: "r2_access_key_id " }),
    R2_SECRET_ACCESS_KEY: Type.String({ default: "r2_secret_Access_key" }),

    R2_ENDPOINT: Type.String({
        default:
            "https://d84c58bc43f6c50f8799a4b8485f5b35.r2.cloudflarestorage.com",
    }),
    R2_PUBLIC_URL: Type.String({
        default: "https://pub-2e6c13927ac24d548fd5b783e3cdaeb5.r2.dev",
    }),

    REDIS_URL: Type.String(),
});

export type EnvConfig = Static<typeof EnvSchema>;
