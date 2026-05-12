import { describe, expect, it } from "vitest";
import { PasswordService } from "@infrastructure/security/password.service";

describe("PasswordService", () => {
    const svc = new PasswordService();

    describe("hash", () => {
        it("should return a non-empty string", async () => {
            const hash = await svc.hash("mypassword");

            expect(typeof hash).toBe("string");
            expect(hash.length).toBeGreaterThan(0);
        });

        it("should produce different hashes for the same input (salt)", async () => {
            const hash1 = await svc.hash("mypassword");
            const hash2 = await svc.hash("mypassword");

            expect(hash1).not.toBe(hash2);
        });
    });

    describe("verify", () => {
        it("should return true when plain password matches hash", async () => {
            const hash = await svc.hash("correctpassword");

            await expect(svc.verify("correctpassword", hash)).resolves.toBe(
                true,
            );
        });

        it("should return false when plain password does not match hash", async () => {
            const hash = await svc.hash("correctpassword");

            await expect(svc.verify("wrongpassword", hash)).resolves.toBe(
                false,
            );
        });
    });
});
