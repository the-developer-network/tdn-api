import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import * as nodemailer from "nodemailer";
import {
    NodemailerEmailService,
    type SmtpConfig,
} from "@infrastructure/services/nodemailer-email.service";
import type { FastifyBaseLogger } from "fastify";

vi.mock("nodemailer");

describe("Nodemailer Email Service", () => {
    /**
     * Arrange (Global)
     */
    let emailService: NodemailerEmailService;
    let mockLogger: any;
    let mockSendMail: any;
    let config: SmtpConfig;

    beforeEach(() => {
        config = {
            host: "smtp.mailtrap.io",
            port: 2525,
            secure: false,
            user: "testuser",
            pass: "testpass",
            from: "noreply@tdn.com",
        };

        mockLogger = {
            info: vi.fn(),
            error: vi.fn(),
        };

        mockSendMail = vi.fn().mockResolvedValue(true);

        (nodemailer.createTransport as any).mockReturnValue({
            sendMail: mockSendMail,
        });

        // Servisi sahte bağımlılıklarla ayağa kaldırıyoruz
        emailService = new NodemailerEmailService(
            config,
            mockLogger as unknown as FastifyBaseLogger,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Constructor Initialization", () => {
        it("Should create a nodemailer transport with the provided config.", () => {
            // Assert
            expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                host: config.host,
                port: config.port,
                secure: config.secure,
                auth: {
                    user: config.user,
                    pass: config.pass,
                },
            });
        });
    });

    describe("Send Verification Email sendVerificationEmail()", () => {
        it("Should send an email with the correct details and log success.", async () => {
            // Arrange
            const input = { to: "user@example.com", otp: "12345678" };

            // Act
            await emailService.sendVerificationEmail(input);

            // Assert
            expect(mockSendMail).toHaveBeenCalledTimes(1);
            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.to).toBe(input.to);
            expect(callArgs.subject).toBe("E-posta Doğrulama Kodunuz (OTP)");
            expect(callArgs.html).toContain(input.otp);

            expect(mockLogger.info).toHaveBeenCalledWith(
                "Verification email sent successfully via Nodemailer.",
            );
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it("Should catch the error and log it if sending the email fails.", async () => {
            // Arrange
            const input = { to: "user@example.com", otp: "12345678" };

            mockSendMail.mockRejectedValueOnce(
                new Error("SMTP Connection Error"),
            );

            // Act
            await emailService.sendVerificationEmail(input);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(
                "Failed to send verification email via Nodemailer.",
            );
            expect(mockLogger.info).not.toHaveBeenCalled();
        });
    });

    describe("Send Password Reset Email sendPasswordResetEmail()", () => {
        it("Should send a password reset email and log success.", async () => {
            // Arrange
            const input = { to: "hacker@example.com", otp: "87654321" };

            // Act
            await emailService.sendPasswordResetEmail(input);

            // Assert
            expect(mockSendMail).toHaveBeenCalledTimes(1);
            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.to).toBe(input.to);
            expect(callArgs.subject).toBe("Şifre Sıfırlama İsteği");
            expect(callArgs.html).toContain(input.otp);

            expect(mockLogger.info).toHaveBeenCalledWith(
                "Password reset email sent successfully.",
            );
        });

        it("Should catch the error and log it if sending the reset email fails.", async () => {
            // Arrange
            const input = { to: "user@example.com", otp: "12345678" };
            mockSendMail.mockRejectedValueOnce(new Error("Network Timeout"));

            // Act
            await emailService.sendPasswordResetEmail(input);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(
                "Failed to send password reset email.",
            );
        });
    });
});
