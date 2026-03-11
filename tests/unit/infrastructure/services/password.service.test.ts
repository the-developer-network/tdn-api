import { describe, beforeEach, it, expect } from "vitest";
import { PasswordService } from "@infrastructure/services/password.service";

describe("Password Service", () => {
    /**
     * Arrange
     */
    let passwordService: PasswordService;

    beforeEach(() => {
        passwordService = new PasswordService();
    });

    describe("Hash Password hash()", () => {
        it("Should hash the plain text password and return a valid argon2i string.", async () => {
            const plainPassword = "SuperSecretPassword123!";

            // Act
            const hashedPassword = await passwordService.hash(plainPassword);

            // Assert
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(plainPassword);
            expect(hashedPassword.startsWith("$argon2i$")).toBe(true);
        });
    });

    describe("Verify Password verify()", () => {
        it("Should return true when the correct plain password matches the hash.", async () => {
            // Arrange
            const plainPassword = "SuperSecretPassword123!";
            const hashedPassword = await passwordService.hash(plainPassword);

            // Act
            const isMatch = await passwordService.verify(
                plainPassword,
                hashedPassword,
            );

            // Assert
            expect(isMatch).toBe(true);
        });

        it("Should return false when an incorrect password is provided.", async () => {
            // Arrange
            const plainPassword = "SuperSecretPassword123!";
            const wrongPassword = "WrongPassword456!";
            const hashedPassword = await passwordService.hash(plainPassword);

            const isMatch = await passwordService.verify(
                wrongPassword,
                hashedPassword,
            );

            expect(isMatch).toBe(false);
        });
    });
});
