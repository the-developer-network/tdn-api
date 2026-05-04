import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgotPasswordUseCase } from "@core/use-cases/auth/forgot-password";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/ports/repositories/verification-token.repository";
import type { EmailPort } from "@core/ports/services/email.port";
import type { CryptoPort } from "@core/ports/services/crypto.port";
import { TokenType } from "@core/domain/enums/token-type.enum";
import type { VerificationToken } from "@core/domain/entities/verification-token.entity";
import { buildUser } from "../../../helpers/mock-factories";

describe("ForgotPasswordUseCase", () => {
    let userRepo: Pick<IUserRepository, "findByEmail">;
    let verificationTokenRepo: Pick<IVerificationTokenRepository, "upsert">;
    let emailService: Pick<EmailPort, "sendPasswordResetEmail">;
    let cryptoService: Pick<CryptoPort, "generateOtp" | "hashOtp">;
    let useCase: ForgotPasswordUseCase;

    beforeEach(() => {
        userRepo = { findByEmail: vi.fn() };
        verificationTokenRepo = { upsert: vi.fn() };
        emailService = { sendPasswordResetEmail: vi.fn() };
        cryptoService = {
            generateOtp: vi.fn().mockReturnValue("12345678"),
            hashOtp: vi.fn().mockReturnValue("hashed_otp"),
        };

        useCase = new ForgotPasswordUseCase(
            userRepo as IUserRepository,
            verificationTokenRepo as IVerificationTokenRepository,
            emailService as EmailPort,
            cryptoService as CryptoPort,
        );
    });

    it("user not found → returns silently, no email sent", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

        await useCase.execute({ email: "notexists@example.com" });

        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        expect(verificationTokenRepo.upsert).not.toHaveBeenCalled();
    });

    it("soft-deleted user → returns silently, no email sent", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(
            buildUser({ deletedAt: new Date() }),
        );

        await useCase.execute({ email: "test@example.com" });

        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        expect(verificationTokenRepo.upsert).not.toHaveBeenCalled();
    });

    it("email not verified → returns silently, no email sent", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(
            buildUser({ isEmailVerified: false }),
        );

        await useCase.execute({ email: "test@example.com" });

        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        expect(verificationTokenRepo.upsert).not.toHaveBeenCalled();
    });

    it("OAuth-only user (no passwordHash) → returns silently, no email sent", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(
            buildUser({ passwordHash: null }),
        );

        await useCase.execute({ email: "test@example.com" });

        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
        expect(verificationTokenRepo.upsert).not.toHaveBeenCalled();
    });

    it("happy path: generates OTP, upserts token, sends reset email", async () => {
        const user = buildUser();
        vi.mocked(userRepo.findByEmail).mockResolvedValue(user);
        vi.mocked(verificationTokenRepo.upsert).mockResolvedValue(
            {} as VerificationToken,
        );
        vi.mocked(emailService.sendPasswordResetEmail).mockResolvedValue();

        await useCase.execute({ email: user.email });

        expect(cryptoService.generateOtp).toHaveBeenCalledWith(8);
        expect(cryptoService.hashOtp).toHaveBeenCalledWith("12345678");
        expect(verificationTokenRepo.upsert).toHaveBeenCalledWith({
            userId: user.id,
            tokenHash: "hashed_otp",
            type: TokenType.PASSWORD_RESET,
            expiresAt: expect.any(Date),
        });
        expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
            to: user.email,
            otp: "12345678",
        });
    });
});
