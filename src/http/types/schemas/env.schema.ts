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
    REFRESH_TOKEN_CLEANUP_CRON: Type.String({ default: "0 */6 * * *" }),
    REFRESH_TOKEN_CLEANUP_GRACE_PERIOD_HOURS: Type.Number({ default: 24 }),

    // --- SMTP & Email Configuration ---
    SMTP_HOST: Type.String({ default: "sdasa" }),
    SMTP_PORT: Type.Number({ default: 2525 }),
    SMTP_SECURE: Type.Boolean({ default: false }),
    SMTP_USER: Type.String({ default: "user" }),
    SMTP_PASS: Type.String({ default: "123" }),
    EMAIL_FROM: Type.String({ default: "email" }),

    // --- Others ---
    CORS_ORIGIN: Type.String({ default: "http://localhost:3000" }),
});

export type EnvConfig = Static<typeof EnvSchema>;
