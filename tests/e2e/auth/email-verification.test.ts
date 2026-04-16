import { authRequest, parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * End-to-end tests for the email verification flow:
 *   POST /auth/send-verification  — triggers a verification email
 *   POST /auth/verify-email       — verifies the supplied OTP
 *
 * Both endpoints require a valid JWT (fastify.authenticate).
 */
describe("Email Verification Flow", () => {
    const ts = Date.now();

    const user = {
        email: `verify_${ts}@example.com`,
        password: "password123",
        username: `verify_${ts}`.slice(0, 30),
    };

    let accessToken: string;

    /**
     * Register and log in once so that `accessToken` is available for the
     * authenticated scenarios below.
     */
    beforeAll(async () => {
        await request({
            method: "POST",
            url: "/auth/register",
            payload: user,
        });

        const loginRes = await request({
            method: "POST",
            url: "/auth/login",
            payload: { identifier: user.email, password: user.password },
        });

        accessToken = parseBody<{ data: { accessToken: string } }>(loginRes)
            .data.accessToken;
    });

    /**
     * Calling send-verification without an Authorization header must be
     * rejected with 401 UnauthorizedError.
     */
    it("POST /auth/send-verification — should return 401 without authentication", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/send-verification",
        });

        expect(response.statusCode).toBe(401);

        const body = parseBody<{
            type: string;
            title: string;
            instance: string;
        }>(response);

        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("UnauthorizedError");
        expect(body.instance).toBe("/api/v1/auth/send-verification");
    });

    /**
     * An authenticated request to send-verification must return 200 with
     * `{ sent: true }`.
     */
    it("POST /auth/send-verification — should return 200 with sent=true for authenticated user", async () => {
        const response = await authRequest(accessToken, {
            method: "POST",
            url: "/auth/send-verification",
        });

        expect(response.statusCode).toBe(200);

        const body = parseBody<{
            data: { sent: boolean };
            meta: { timestamp: string };
        }>(response);

        expect(body.data.sent).toBe(true);
        expect(body.meta.timestamp).toBeDefined();
    });

    /**
     * Calling verify-email without an Authorization header must return 401.
     */
    it("POST /auth/verify-email — should return 401 without authentication", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/verify-email",
            payload: { otp: "12345678" },
        });

        expect(response.statusCode).toBe(401);

        const body = parseBody<{ title: string }>(response);
        expect(body.title).toBe("UnauthorizedError");
    });

    /**
     * Submitting an OTP that fails the TypeBox pattern constraint
     * (`^[0-9]+$`) or length check must trigger schema validation and
     * return 400 Validation Error.
     */
    it("POST /auth/verify-email — should return 400 for an OTP with invalid format", async () => {
        const response = await authRequest(accessToken, {
            method: "POST",
            url: "/auth/verify-email",
            payload: { otp: "abcd1234" },
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
        expect(body.instance).toBe("/api/v1/auth/verify-email");
        expect(Array.isArray(body.validation)).toBe(true);
    });

    /**
     * Submitting a correctly-formatted 8-digit OTP that does not match the
     * stored code must return 400 with detail "Invalid verification code."
     */
    it("POST /auth/verify-email — should return 400 for a well-formed but incorrect OTP", async () => {
        const response = await authRequest(accessToken, {
            method: "POST",
            url: "/auth/verify-email",
            payload: { otp: "00000000" },
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
        expect(body.detail).toBe("Invalid verification code.");
        expect(body.instance).toBe("/api/v1/auth/verify-email");
    });
});
