import { describe, it, expect, vi, beforeEach } from "vitest";
import { SendVerificationEmailUseCase } from "@core/use-cases/auth/send-verification-email";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/ports/repositories/verification-token.repository";
import type { EmailPort } from "@core/ports/services/email.port";
import type { CryptoPort } from "@core/ports/services/crypto.port";
import { TokenType } from "@core/domain/enums/token-type.enum";
import type { VerificationToken } from "@core/domain/entities/verification-token.entity";
import { UnauthorizedError } from "@core/errors";
import { buildUser } from "../../../helpers/mock-factories";

describe("SendVerificationEmailUseCase", () => {
    let userRepo: Pick<IUserRepository, "findById">;
    let verificationTokenRepo: Pick<IVerificationTokenRepository, "upsert">;
    let emailService: Pick<EmailPort, "sendVerificationEmail">;
    let cryptoService: Pick<CryptoPort, "generateOtp" | "hashOtp">;
    let useCase: SendVerificationEmailUseCase;

    const OTP_EXPIRY_SECONDS = 600;

    beforeEach(() => {
        userRepo = { findById: vi.fn() };
        verificationTokenRepo = { upsert: vi.fn() };
        emailService = { sendVerificationEmail: vi.fn() };
        cryptoService = {
            generateOtp: vi.fn().mockReturnValue("12345678"),
            hashOtp: vi.fn().mockReturnValue("hashed_otp"),
        };

        useCase = new SendVerificationEmailUseCase(
            userRepo as IUserRepository,
            verificationTokenRepo as IVerificationTokenRepository,
            emailService as EmailPort,
            cryptoService as CryptoPort,
            OTP_EXPIRY_SECONDS,
        );
    });

    it("user not found → throws UnauthorizedError", async () => {
        vi.mocked(userRepo.findById).mockResolvedValue(null);

        await expect(useCase.execute({ userId: "user-1" })).rejects.toThrow(
            UnauthorizedError,
        );

        expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("soft-deleted user → throws UnauthorizedError", async () => {
        vi.mocked(userRepo.findById).mockResolvedValue(
            buildUser({ deletedAt: new Date() }),
        );

        await expect(useCase.execute({ userId: "user-1" })).rejects.toThrow(
            UnauthorizedError,
        );

        expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it("already verified email → returns silently, no email sent", async () => {
        vi.mocked(userRepo.findById).mockResolvedValue(
            buildUser({ isEmailVerified: true }),
        );

        await useCase.execute({ userId: "user-1" });

        expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
        expect(verificationTokenRepo.upsert).not.toHaveBeenCalled();
    });

    it("happy path: generates OTP, upserts token, sends verification email", async () => {
        const user = buildUser({ isEmailVerified: false });
        vi.mocked(userRepo.findById).mockResolvedValue(user);
        vi.mocked(verificationTokenRepo.upsert).mockResolvedValue(
            {} as VerificationToken,
        );
        vi.mocked(emailService.sendVerificationEmail).mockResolvedValue();

        await useCase.execute({ userId: user.id });

        expect(cryptoService.generateOtp).toHaveBeenCalledWith(8);
        expect(cryptoService.hashOtp).toHaveBeenCalledWith("12345678");
        expect(verificationTokenRepo.upsert).toHaveBeenCalledWith({
            userId: user.id,
            tokenHash: "hashed_otp",
            type: TokenType.EMAIL_VERIFICATION,
            expiresAt: expect.any(Date),
        });
        expect(emailService.sendVerificationEmail).toHaveBeenCalledWith({
            to: user.email,
            otp: "12345678",
        });
    });

    it("happy path: expiresAt is approximately OTP_EXPIRY_SECONDS from now", async () => {
        const user = buildUser({ isEmailVerified: false });
        vi.mocked(userRepo.findById).mockResolvedValue(user);
        vi.mocked(verificationTokenRepo.upsert).mockResolvedValue(
            {} as VerificationToken,
        );

        const before = Date.now();
        await useCase.execute({ userId: user.id });
        const after = Date.now();

        const upsertCall = vi.mocked(verificationTokenRepo.upsert).mock
            .calls[0][0];
        const expiresAtMs = upsertCall.expiresAt.getTime();

        expect(expiresAtMs).toBeGreaterThanOrEqual(
            before + OTP_EXPIRY_SECONDS * 1000,
        );
        expect(expiresAtMs).toBeLessThanOrEqual(
            after + OTP_EXPIRY_SECONDS * 1000,
        );
    });
});
