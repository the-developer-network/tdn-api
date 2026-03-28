import type {
    EmailInput,
    EmailPort,
    OtpEmailInput,
} from "@core/ports/services/email.port";
import type { FastifyBaseLogger } from "fastify";
import { Resend } from "resend";

export interface EmailConfig {
    from: string;
    apiKey: string;
}

interface BaseEmailTemplate {
    title: string;
    heading: string;
    greeting: string;
    body: string;
    footer: string;
}

interface OtpEmailTemplate extends BaseEmailTemplate {
    type: "otp";
    otp: string;
}

interface AlertEmailTemplate extends BaseEmailTemplate {
    type: "alert";
    alertTitle: string;
    alertBody: string;
}

type EmailTemplate = OtpEmailTemplate | AlertEmailTemplate;

function buildEmailHtml(template: EmailTemplate): string {
    const baseStyles = `
            body { margin: 0; padding: 0; background-color: #f5f5f5; }
            .wrapper {
                font-family: 'Courier New', Courier, monospace;
                max-width: 560px;
                margin: 40px auto;
                background: #ffffff;
                border: 1px solid #000000;
            }
            .header {
                background-color: #000000;
                padding: 24px 32px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .header-brand {
                font-size: 22px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: 4px;
                text-transform: uppercase;
            }
            .header-divider {
                width: 1px;
                height: 20px;
                background: #444;
                display: inline-block;
                margin: 0 12px;
                vertical-align: middle;
            }
            .header-label {
                font-size: 11px;
                color: #888888;
                letter-spacing: 2px;
                text-transform: uppercase;
                vertical-align: middle;
            }
            .content {
                padding: 32px;
                border-bottom: 1px solid #e0e0e0;
            }
            .greeting {
                font-size: 14px;
                color: #111111;
                margin: 0 0 12px 0;
            }
            .body-text {
                font-size: 14px;
                color: #444444;
                line-height: 1.7;
                margin: 0 0 24px 0;
            }
            .otp-box {
                border: 2px solid #000000;
                padding: 24px;
                text-align: center;
                margin: 24px 0;
            }
            .otp-code {
                font-size: 36px;
                font-weight: 700;
                letter-spacing: 12px;
                color: #000000;
                display: block;
            }
            .alert-box {
                border-left: 4px solid #000000;
                background-color: #f9f9f9;
                padding: 16px 20px;
                margin: 24px 0;
            }
            .alert-title {
                font-size: 13px;
                font-weight: 700;
                color: #000000;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0 0 8px 0;
            }
            .alert-body {
                font-size: 13px;
                color: #555555;
                line-height: 1.6;
                margin: 0;
            }
            .footer {
                padding: 20px 32px;
                background-color: #fafafa;
            }
            .footer-text {
                font-size: 11px;
                color: #999999;
                margin: 0;
                line-height: 1.6;
                text-align: center;
                letter-spacing: 0.5px;
            }
        `;

    const otpBlock =
        template.type === "otp"
            ? `<div class="otp-box">
                    <span class="otp-code">${template.otp}</span>
                </div>`
            : "";

    const alertBlock =
        template.type === "alert"
            ? `<div class="alert-box">
                    <p class="alert-title">${template.alertTitle}</p>
                    <p class="alert-body">${template.alertBody}</p>
                </div>`
            : "";

    return `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>${template.title}</title>
                <style>${baseStyles}</style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="header">
                        <span class="header-brand">tdn</span>
                        <span>
                            <span class="header-divider"></span>
                            <span class="header-label">${template.heading}</span>
                        </span>
                    </div>
                    <div class="content">
                        <p class="greeting">${template.greeting}</p>
                        <p class="body-text">${template.body}</p>
                        ${otpBlock}
                        ${alertBlock}
                    </div>
                    <div class="footer">
                        <p class="footer-text">${template.footer}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
}

export class EmailService implements EmailPort {
    private resend: Resend;

    constructor(
        private readonly config: EmailConfig,
        private readonly logger: FastifyBaseLogger,
    ) {
        this.resend = new Resend(this.config.apiKey);
    }

    private async send(
        to: string,
        subject: string,
        html: string,
    ): Promise<void> {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.config.from,
                to: [to],
                subject: subject,
                html: html,
            });

            if (error) {
                this.logger.error({ error }, "Resend API Error");
                return;
            }

            this.logger.info(
                { id: data?.id },
                "Email sent successfully via Resend",
            );
        } catch (err) {
            this.logger.error(err, "Unexpected error during email sending");
        }
    }

    async sendVerificationEmail(input: OtpEmailInput): Promise<void> {
        const html = buildEmailHtml({
            type: "otp",
            title: "Email Verification",
            heading: "Account Verification",
            greeting: "Hello,",
            body: "Your one-time verification code is below to continue the process.",
            otp: input.otp,
            footer: "This code is valid for 10 minutes. Do not share this code with anyone.",
        });

        await this.send(input.to, "Your Email Verification Code (OTP)", html);
    }

    async sendPasswordResetEmail(input: OtpEmailInput): Promise<void> {
        const html = buildEmailHtml({
            type: "otp",
            title: "Password Reset",
            heading: "Password Reset",
            greeting: "Hello,",
            body: "Your one-time verification code for password reset request is below.",
            otp: input.otp,
            footer: "This code is valid for 10 minutes. Do not share this code with anyone.",
        });

        await this.send(input.to, "Password Reset Request", html);
    }

    async sendDeleteUserEmail(input: EmailInput): Promise<void> {
        const html = buildEmailHtml({
            type: "alert",
            title: "Account Deletion",
            heading: "Account Deletion",
            greeting: "Hello,",
            body: "We have received your request to delete your account. Your account will be permanently deleted in <strong>30 days</strong>.",
            alertTitle: "Change Your Mind?",
            alertBody:
                "If you log back into your account within 30 days, the process will be canceled.",
            footer: "Thank you for being with us.",
        });

        await this.send(
            input.to,
            "Your Account is Scheduled for Deletion",
            html,
        );
    }
}
