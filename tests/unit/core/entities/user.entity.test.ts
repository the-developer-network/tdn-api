import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { User, type UserProps } from "@core/entities/user.entity";

describe("User Entity", () => {
    /**
     * Arrange (Global)
     */
    let baseProps: UserProps;

    beforeEach(() => {
        baseProps = {
            id: "user-123",
            email: "test@example.com",
            username: "testuser",
            passwordHash: "hashed_password",
            isEmailVerified: false,
            deletedAt: null,
            createdAt: new Date("2026-01-01T10:00:00Z"),
            updatedAt: new Date("2026-01-01T10:00:00Z"),
        };

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Constructor & Getters", () => {
        it("Should correctly initialize the user and return properties via getters.", () => {
            /** Act */
            const user = new User(baseProps);

            /** Assert */
            expect(user.id).toBe(baseProps.id);
            expect(user.email).toBe(baseProps.email);
            expect(user.username).toBe(baseProps.username);
            expect(user.passwordHash).toBe(baseProps.passwordHash);
            expect(user.isEmailVerified).toBe(baseProps.isEmailVerified);
            expect(user.deletedAt).toBe(baseProps.deletedAt);
            expect(user.createdAt).toBe(baseProps.createdAt);
            expect(user.updatedAt).toBe(baseProps.updatedAt);
        });
    });

    describe("isDeleted()", () => {
        it("Should return false if deletedAt is null.", () => {
            const user = new User({ ...baseProps, deletedAt: null });
            expect(user.isDeleted()).toBe(false);
        });

        it("Should return true if deletedAt has a valid date.", () => {
            const user = new User({ ...baseProps, deletedAt: new Date() });
            expect(user.isDeleted()).toBe(true);
        });
    });

    describe("hasPassword()", () => {
        it("Should return true if passwordHash is set.", () => {
            const user = new User({ ...baseProps, passwordHash: "some_hash" });
            expect(user.hasPassword()).toBe(true);
        });

        it("Should return false if passwordHash is null.", () => {
            const user = new User({ ...baseProps, passwordHash: null });
            expect(user.hasPassword()).toBe(false);
        });
    });

    describe("hashPassword (Setter)", () => {
        it("Should successfully update the passwordHash property.", () => {
            const user = new User({ ...baseProps, passwordHash: "old_hash" });

            /** Act */
            user.hashPassword = "new_secure_hash";

            /** Assert */
            expect(user.passwordHash).toBe("new_secure_hash");
        });
    });

    describe("delete()", () => {
        it("Should set deletedAt and updatedAt to the current date.", () => {
            const user = new User(baseProps);

            /** Act */
            user.delete();

            /** Assert */
            expect(user.isDeleted()).toBe(true);
            expect(user.deletedAt).toEqual(new Date("2026-03-10T12:00:00Z"));
            expect(user.updatedAt).toEqual(new Date("2026-03-10T12:00:00Z"));
        });
    });

    describe("restore()", () => {
        it("Should set deletedAt to null and update the updatedAt date.", () => {
            const deletedProps = {
                ...baseProps,
                deletedAt: new Date("2026-02-01T00:00:00Z"),
                updatedAt: new Date("2026-02-01T00:00:00Z"),
            };
            const user = new User(deletedProps);

            /** Act */
            user.restore();

            /** Assert */
            expect(user.isDeleted()).toBe(false);
            expect(user.deletedAt).toBeNull();
            expect(user.updatedAt).toEqual(new Date("2026-03-10T12:00:00Z"));
        });
    });

    describe("verifyEmail()", () => {
        it("Should set isEmailVerified to true.", () => {
            const user = new User({ ...baseProps, isEmailVerified: false });

            /** Act */
            user.verifyEmail();

            /** Assert */
            expect(user.isEmailVerified).toBe(true);
        });
    });
});
