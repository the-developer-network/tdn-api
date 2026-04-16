import { parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * End-to-end tests for POST /auth/check.
 *
 * Validates that the endpoint correctly reports whether a given identifier
 * (username or email) belongs to an existing account.
 */
describe("POST /auth/check - Check User Existence", () => {
    const ts = Date.now();

    const user = {
        email: `check_${ts}@example.com`,
        password: "password123",
        username: `check_${ts}`.slice(0, 30),
    };

    /**
     * Register a user so that the existence checks have something to match against.
     */
    beforeAll(async () => {
        await request({
            method: "POST",
            url: "/auth/register",
            payload: user,
        });
    });

    /**
     * Querying with an identifier that matches an existing username must
     * return `{ check: true }`.
     */
    it("should return check=true for an existing username", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/check",
            payload: { identifier: user.username },
        });

        expect(response.statusCode).toBe(200);

        const body = parseBody<{
            data: { check: boolean };
            meta: { timestamp: string };
        }>(response);

        expect(body.data.check).toBe(true);
        expect(body.meta.timestamp).toBeDefined();
    });

    /**
     * Querying with an identifier that matches an existing email address
     * must return `{ check: true }`.
     */
    it("should return check=true for an existing email address", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/check",
            payload: { identifier: user.email },
        });

        expect(response.statusCode).toBe(200);

        const body = parseBody<{ data: { check: boolean } }>(response);

        expect(body.data.check).toBe(true);
    });

    /**
     * Querying with an identifier that does not match any account must
     * return `{ check: false }` — the endpoint must not expose user
     * enumeration errors.
     */
    it("should return check=false for a non-existent identifier", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/check",
            payload: { identifier: `nonexistent_${ts}@example.com` },
        });

        expect(response.statusCode).toBe(200);

        const body = parseBody<{ data: { check: boolean } }>(response);

        expect(body.data.check).toBe(false);
    });

    /**
     * Omitting the required `identifier` field must trigger schema
     * validation and return 400.
     */
    it("should return 400 when the identifier field is missing", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/check",
            payload: {},
        });

        expect(response.statusCode).toBe(400);

        const body = parseBody<{
            type: string;
            title: string;
            instance: string;
        }>(response);

        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("Validation Error");
        expect(body.instance).toBe("/api/v1/auth/check");
    });
});
