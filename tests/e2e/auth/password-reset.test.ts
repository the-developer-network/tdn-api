import { parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * End-to-end tests for the password-reset flow:
 *   POST /auth/forgot-password  — requests an OTP via email
 *   POST /auth/reset-password   — resets the password using the OTP
 *
 * Neither endpoint requires authentication.
 */
describe("Password Reset Flow", () => {
    const ts = Date.now();

    const user = {
        email: `pwreset_${ts}@example.com`,
        password: "password123",
        username: `pwreset_${ts}`.slice(0, 30),
    };

    /**
     * Register a user so that the forgot-password flow can find a real account.
     */
    beforeAll(async () => {
        await request({
            method: "POST",
            url: "/auth/register",
            payload: user,
        });
    });

    /**
     * Submitting a registered email address must trigger the OTP email and
     * return 204 No Content.
     */
    it("POST /auth/forgot-password — should return 204 for a registered email", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/forgot-password",
            payload: { email: user.email },
        });

        expect(response.statusCode).toBe(204);
    });

    /**
     * Submitting an email that has no associated account must also return
     * 204 to prevent user enumeration attacks.
     */
    it("POST /auth/forgot-password — should return 204 for an unknown email (enumeration prevention)", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/forgot-password",
            payload: { email: `unknown_${ts}@example.com` },
        });

        expect(response.statusCode).toBe(204);
    });

    /**
     * Submitting a value that does not match the email format must trigger
     * schema validation and return 400.
     */
    it("POST /auth/forgot-password — should return 400 for an invalid email format", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/forgot-password",
            payload: { email: "not-a-valid-email" },
        });

        expect(response.statusCode).toBe(400);

        const body = parseBody<{
            type: string;
            title: string;
            instance: string;
            validation: unknown[];
        }>(response);

        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("Validation Error");
        expect(body.instance).toBe("/api/v1/auth/forgot-password");
        expect(Array.isArray(body.validation)).toBe(true);
    });

    /**
     * Submitting an OTP that does not match the stored reset code must
     * return 400 with detail "Invalid or expired reset credentials."
     */
    it("POST /auth/reset-password — should return 400 for an incorrect OTP", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/reset-password",
            payload: {
                email: user.email,
                otp: "00000000",
                newPassword: "newpassword123",
            },
        });

        expect(response.statusCode).toBe(400);

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            instance: string;
        }>(response);

        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("BadRequestError");
        expect(body.detail).toBe("Invalid or expired reset credentials.");
        expect(body.instance).toBe("/api/v1/auth/reset-password");
    });

    /**
     * Omitting required fields (e.g., `otp`, `newPassword`) must trigger
     * schema validation and return 400.
     */
    it("POST /auth/reset-password — should return 400 when required fields are missing", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/reset-password",
            payload: { email: user.email },
        });

        expect(response.statusCode).toBe(400);

        const body = parseBody<{
            type: string;
            title: string;
            instance: string;
        }>(response);

        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("Validation Error");
        expect(body.instance).toBe("/api/v1/auth/reset-password");
    });
});
