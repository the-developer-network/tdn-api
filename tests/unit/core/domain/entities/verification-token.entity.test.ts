import { describe, it, expect } from "vitest";
import { VerificationToken } from "@core/domain/entities/verification-token.entity";
import { TokenType } from "@core/domain/enums/token-type.enum";
import type { VerificationTokenProps } from "@core/domain/interfaces/verification-token.props.interface";

function buildProps(
    overrides: Partial<VerificationTokenProps> = {},
): VerificationTokenProps {
    return {
        id: "vtoken-1",
        tokenHash: "sha256_hashed_otp",
        userId: "user-1",
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date("2024-01-01T00:00:00Z"),
        ...overrides,
    };
}

describe("VerificationToken Entity", () => {
    describe("Getters", () => {
        it("should return correct id", () => {
            const token = VerificationToken.with(buildProps());
            expect(token.id).toBe("vtoken-1");
        });

        it("should return correct tokenHash", () => {
            const token = VerificationToken.with(buildProps());
            expect(token.tokenHash).toBe("sha256_hashed_otp");
        });

        it("should return correct userId", () => {
            const token = VerificationToken.with(buildProps());
            expect(token.userId).toBe("user-1");
        });

        it("should return EMAIL_VERIFICATION type", () => {
            const token = VerificationToken.with(
                buildProps({ type: TokenType.EMAIL_VERIFICATION }),
            );
            expect(token.type).toBe(TokenType.EMAIL_VERIFICATION);
        });

        it("should return PASSWORD_RESET type", () => {
            const token = VerificationToken.with(
                buildProps({ type: TokenType.PASSWORD_RESET }),
            );
            expect(token.type).toBe(TokenType.PASSWORD_RESET);
        });

        it("should return correct createdAt", () => {
            const token = VerificationToken.with(buildProps());
            expect(token.createdAt).toEqual(new Date("2024-01-01T00:00:00Z"));
        });

        it("should return correct expiresAt", () => {
            const expiresAt = new Date(Date.now() + 60_000);
            const token = VerificationToken.with(buildProps({ expiresAt }));
            expect(token.expiresAt).toEqual(expiresAt);
        });
    });

    describe("isExpired()", () => {
        it("should return false when token has not expired", () => {
            const token = VerificationToken.with(
                buildProps({
                    expiresAt: new Date(Date.now() + 60_000),
                }),
            );
            expect(token.isExpired()).toBe(false);
        });

        it("should return true when token has expired", () => {
            const token = VerificationToken.with(
                buildProps({
                    expiresAt: new Date(Date.now() - 1000),
                }),
            );
            expect(token.isExpired()).toBe(true);
        });
    });

    describe("isValid()", () => {
        it("should return true when not expired", () => {
            const token = VerificationToken.with(
                buildProps({
                    expiresAt: new Date(Date.now() + 60_000),
                }),
            );
            expect(token.isValid()).toBe(true);
        });

        it("should return false when expired", () => {
            const token = VerificationToken.with(
                buildProps({
                    expiresAt: new Date(Date.now() - 1000),
                }),
            );
            expect(token.isValid()).toBe(false);
        });

        it("should be consistent with isExpired()", () => {
            const token = VerificationToken.with(
                buildProps({
                    expiresAt: new Date(Date.now() - 1000),
                }),
            );
            expect(token.isValid()).toBe(!token.isExpired());
        });
    });
});
