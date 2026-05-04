import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordUseCase } from "@core/use-cases/auth/reset-password/reset-password.usecase";
import { BadRequestError } from "@core/errors";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type { IVerificationTokenRepository } from "@core/ports/repositories/verification-token.repository";
import type { PasswordPort } from "@core/ports/services/password.port";
import type { CryptoPort } from "@core/ports/services/crypto.port";
import type {
    TransactionPort,
    TransactionContext,
} from "@core/ports/services/transaction.port";
import {
    buildUser,
    buildVerificationToken,
} from "../../../helpers/mock-factories";
import { TokenType } from "@core/domain/enums/token-type.enum";

describe("ResetPasswordUseCase", () => {
    let useCase: ResetPasswordUseCase;
    let userRepo: Pick<IUserRepository, "findByEmail">;
    let verificationTokenRepo: Pick<
        IVerificationTokenRepository,
        "findByUserIdAndType"
    >;
    let passwordSvc: Pick<PasswordPort, "hash">;
    let cryptoSvc: Pick<CryptoPort, "hashOtp" | "timingSafeEqual">;
    let transactionSvc: Pick<TransactionPort, "runInTransaction">;

    const input = {
        email: "test@example.com",
        otp: "12345678",
        newPassword: "newSecurePassword123!",
    };

    beforeEach(() => {
        userRepo = { findByEmail: vi.fn() };
        verificationTokenRepo = { findByUserIdAndType: vi.fn() };
        passwordSvc = { hash: vi.fn() };
        cryptoSvc = {
            hashOtp: vi.fn(),
            timingSafeEqual: vi.fn(),
        };
        transactionSvc = { runInTransaction: vi.fn() };

        useCase = new ResetPasswordUseCase(
            userRepo as IUserRepository,
            verificationTokenRepo as IVerificationTokenRepository,
            passwordSvc as PasswordPort,
            cryptoSvc as CryptoPort,
            transactionSvc as TransactionPort,
        );
    });

    it("should throw BadRequestError when user is not found", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError when user is soft-deleted", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(
            buildUser({ deletedAt: new Date() }),
        );

        await expect(useCase.execute(input)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError when user has no password (OAuth account)", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(
            buildUser({ passwordHash: null }),
        );

        await expect(useCase.execute(input)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError when verification token is not found", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(buildUser());
        vi.mocked(verificationTokenRepo.findByUserIdAndType).mockResolvedValue(
            null,
        );

        await expect(useCase.execute(input)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError when verification token is expired", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(buildUser());
        vi.mocked(verificationTokenRepo.findByUserIdAndType).mockResolvedValue(
            buildVerificationToken({
                type: TokenType.PASSWORD_RESET,
                expiresAt: new Date(Date.now() - 1000),
            }),
        );

        await expect(useCase.execute(input)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError when OTP does not match", async () => {
        vi.mocked(userRepo.findByEmail).mockResolvedValue(buildUser());
        vi.mocked(verificationTokenRepo.findByUserIdAndType).mockResolvedValue(
            buildVerificationToken({ type: TokenType.PASSWORD_RESET }),
        );
        vi.mocked(cryptoSvc.hashOtp).mockReturnValue("hashed_input_otp");
        vi.mocked(cryptoSvc.timingSafeEqual).mockReturnValue(false);

        await expect(useCase.execute(input)).rejects.toThrow(BadRequestError);
    });

    it("should update password and delete token in transaction on valid input", async () => {
        const user = buildUser();
        const token = buildVerificationToken({
            type: TokenType.PASSWORD_RESET,
        });

        vi.mocked(userRepo.findByEmail).mockResolvedValue(user);
        vi.mocked(verificationTokenRepo.findByUserIdAndType).mockResolvedValue(
            token,
        );
        vi.mocked(cryptoSvc.hashOtp).mockReturnValue("hashed_otp");
        vi.mocked(cryptoSvc.timingSafeEqual).mockReturnValue(true);
        vi.mocked(passwordSvc.hash).mockResolvedValue("new_hashed_password");

        const txUserRepo = { update: vi.fn().mockResolvedValue(undefined) };
        const txVerifTokenRepo = {
            delete: vi.fn().mockResolvedValue(undefined),
        };

        vi.mocked(transactionSvc.runInTransaction).mockImplementation(
            async (work) => {
                return work({
                    userRepository: txUserRepo as unknown as IUserRepository,
                    verificationTokenRepository:
                        txVerifTokenRepo as unknown as IVerificationTokenRepository,
                } as TransactionContext);
            },
        );

        await useCase.execute(input);

        expect(passwordSvc.hash).toHaveBeenCalledWith(input.newPassword);
        expect(transactionSvc.runInTransaction).toHaveBeenCalledOnce();
        expect(txUserRepo.update).toHaveBeenCalledWith(user);
        expect(txVerifTokenRepo.delete).toHaveBeenCalledWith(token.id);
    });

    it("should query verification token with correct type", async () => {
        const user = buildUser();
        vi.mocked(userRepo.findByEmail).mockResolvedValue(user);
        vi.mocked(verificationTokenRepo.findByUserIdAndType).mockResolvedValue(
            null,
        );

        await expect(useCase.execute(input)).rejects.toThrow(BadRequestError);

        expect(verificationTokenRepo.findByUserIdAndType).toHaveBeenCalledWith(
            user.id,
            TokenType.PASSWORD_RESET,
        );
    });
});
