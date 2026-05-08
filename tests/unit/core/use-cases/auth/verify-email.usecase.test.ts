import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerifyEmailUseCase } from "@core/use-cases/auth/verify-email";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/ports/repositories/verification-token.repository";
import type { CryptoPort } from "@core/ports/services/crypto.port";
import type {
    TransactionPort,
    TransactionContext,
} from "@core/ports/services/transaction.port";
import { BadRequestError, UnauthorizedError } from "@core/errors";
import {
    buildUser,
    buildVerificationToken,
} from "../../../helpers/mock-factories";
import { TokenType } from "@core/domain/enums/token-type.enum";

describe("VerifyEmailUseCase", () => {
    let userRepo: Pick<IUserRepository, "findById">;
    let verificationTokenRepo: Pick<
        IVerificationTokenRepository,
        "findByUserIdAndType"
    >;
    let cryptoService: Pick<CryptoPort, "hashOtp" | "timingSafeEqual">;
    let txUserRepo: Pick<IUserRepository, "update">;
    let txVerificationTokenRepo: Pick<IVerificationTokenRepository, "delete">;
    let transactionService: TransactionPort;
    let useCase: VerifyEmailUseCase;

    beforeEach(() => {
        userRepo = { findById: vi.fn() };
        verificationTokenRepo = { findByUserIdAndType: vi.fn() };
        cryptoService = {
            hashOtp: vi.fn().mockReturnValue("hashed_otp"),
            timingSafeEqual: vi.fn().mockReturnValue(true),
        };
        txUserRepo = { update: vi.fn() };
        txVerificationTokenRepo = { delete: vi.fn() };

        transactionService = {
            runInTransaction: vi.fn((fn) =>
                fn({
                    userRepository: txUserRepo,
                    verificationTokenRepository: txVerificationTokenRepo,
                } as unknown as TransactionContext),
            ),
        };

        useCase = new VerifyEmailUseCase(
            userRepo as IUserRepository,
            verificationTokenRepo as IVerificationTokenRepository,
            cryptoService as CryptoPort,
            transactionService,
        );
    });

    it("user not found → throws UnauthorizedError", async () => {
        vi.mocked(userRepo.findById).mockResolvedValue(null);

        await expect(
            useCase.execute({ userId: "user-1", otp: "12345678" }),
        ).rejects.toThrow(UnauthorizedError);

        expect(transactionService.runInTransaction).not.toHaveBeenCalled();
    });

    it("soft-deleted user → throws UnauthorizedError", async () => {
        vi.mocked(userRepo.findById).mockResolvedValue(
            buildUser({ deletedAt: new Date() }),
        );

        await expect(
            useCase.execute({ userId: "user-1", otp: "12345678" }),
        ).rejects.toThrow(UnauthorizedError);

        expect(transactionService.runInTransaction).not.toHaveBeenCalled();
    });

    it("already verified email → returns silently, no transaction", async () => {
        vi.mocked(userRepo.findById).mockResolvedValue(
            buildUser({ isEmailVerified: true }),
        );

        await useCase.execute({ userId: "user-1", otp: "12345678" });

        expect(
            verificationTokenRepo.findByUserIdAndType,
        ).not.toHaveBeenCalled();
        expect(transactionService.runInTransaction).not.toHaveBeenCalled();
    });

    it("no verification token found → throws BadRequestError", async () => {
        vi.mocked(userRepo.findById).mockResolvedValue(
            buildUser({ isEmailVerified: false }),
        );
        vi.mocked(verificationTokenRepo.findByUserIdAndType).mockResolvedValue(
            null,
        );

        await expect(
            useCase.execute({ userId: "user-1", otp: "12345678" }),
        ).rejects.toThrow(BadRequestError);

        expect(transactionService.runInTransaction).not.toHaveBeenCalled();
    });

    it("expired token → throws BadRequestError", async () => {
        vi.mocked(userRepo.findById).mockResolvedValue(
            buildUser({ isEmailVerified: false }),
        );
        vi.mocked(verificationTokenRepo.findByUserIdAndType).mockResolvedValue(
            buildVerificationToken({ expiresAt: new Date(Date.now() - 1000) }),
        );

        await expect(
            useCase.execute({ userId: "user-1", otp: "12345678" }),
        ).rejects.toThrow(BadRequestError);

        expect(transactionService.runInTransaction).not.toHaveBeenCalled();
    });

    it("OTP mismatch → throws BadRequestError", async () => {
        vi.mocked(userRepo.findById).mockResolvedValue(
            buildUser({ isEmailVerified: false }),
        );
        vi.mocked(verificationTokenRepo.findByUserIdAndType).mockResolvedValue(
            buildVerificationToken(),
        );
        vi.mocked(cryptoService.timingSafeEqual).mockReturnValue(false);

        await expect(
            useCase.execute({ userId: "user-1", otp: "wrongotp" }),
        ).rejects.toThrow(BadRequestError);

        expect(transactionService.runInTransaction).not.toHaveBeenCalled();
    });

    it("happy path: verifies email and atomically updates user + deletes token", async () => {
        const user = buildUser({ isEmailVerified: false });
        const token = buildVerificationToken({
            userId: user.id,
            type: TokenType.EMAIL_VERIFICATION,
        });

        vi.mocked(userRepo.findById).mockResolvedValue(user);
        vi.mocked(verificationTokenRepo.findByUserIdAndType).mockResolvedValue(
            token,
        );
        vi.mocked(cryptoService.timingSafeEqual).mockReturnValue(true);
        vi.mocked(txUserRepo.update).mockResolvedValue(undefined as never);
        vi.mocked(txVerificationTokenRepo.delete).mockResolvedValue();

        await useCase.execute({ userId: user.id, otp: "12345678" });

        expect(cryptoService.hashOtp).toHaveBeenCalledWith("12345678");
        expect(cryptoService.timingSafeEqual).toHaveBeenCalledWith(
            "hashed_otp",
            token.tokenHash,
        );
        expect(transactionService.runInTransaction).toHaveBeenCalledOnce();
        expect(txUserRepo.update).toHaveBeenCalledWith(user);
        expect(txVerificationTokenRepo.delete).toHaveBeenCalledWith(token.id);
        expect(user.isEmailVerified).toBe(true);
    });
});
