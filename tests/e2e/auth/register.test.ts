import { parseBody, request } from "../setup";
import { describe, expect, it } from "vitest";

/**
 * This test suite validates the user registration flow of the application.
 * It covers the successful registration scenario where a new user provides valid credentials
 * and receives a structured response containing the user's id, username, and createdAt timestamp.
 * It also verifies all failure scenarios including duplicate accounts, invalid field formats,
 * constraint violations, and missing required fields — all returning RFC 7807-compliant error responses.
 */
describe("POST /auth/register - User Registration", () => {
    /**
     * A unique timestamp suffix is used across all test cases to prevent data collisions
     * when tests are executed multiple times against the same database.
     * All generated usernames use only characters permitted by the schema pattern: ^[a-zA-Z0-9._]+$
     */
    const ts = Date.now();

    const validUser = {
        email: `user_${ts}@example.com`,
        username: `user_${ts}`.slice(0, 30),
        password: "password123",
    };

    /**
     * This test verifies that a valid registration request returns a 201 status code
     * and a response body containing the newly created user's id (UUID format), username,
     * and createdAt timestamp in ISO 8601 format. It also confirms the presence of the
     * meta.timestamp field required by the standard response envelope.
     */
    it("should successfully register a new user and return 201 with user data", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/register",
            payload: validUser,
        });

        const body = parseBody<{
            data: { id: string; username: string; createdAt: string };
            meta: { timestamp: string };
        }>(response);

        expect(response.statusCode).toBe(201);
        expect(body.data).toHaveProperty("id");
        expect(body.data.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
        expect(body.data).toHaveProperty("username", validUser.username);
        expect(body.data).toHaveProperty("createdAt");
        expect(new Date(body.data.createdAt).toISOString()).toBe(
            body.data.createdAt,
        );
        expect(body.meta).toHaveProperty("timestamp", expect.any(String));
    });

    /**
     * This test verifies that attempting to register a second account with an already-registered
     * email address results in a 409 Conflict response. A seed user is created first within the
     * test, then a second request is made with the same email but a different username.
     * The response is validated against the RFC 7807 error format and the UserAlreadyExistsError class.
     */
    it("should fail with 409 when the email address is already registered", async () => {
        const duplicateEmailUser = {
            email: `dup_email_${ts}@example.com`,
            username: `orig_${ts}`.slice(0, 30),
            password: "password123",
        };

        await request({
            method: "POST",
            url: "/auth/register",
            payload: duplicateEmailUser,
        });

        const response = await request({
            method: "POST",
            url: "/auth/register",
            payload: {
                email: duplicateEmailUser.email,
                username: `new_${ts}`.slice(0, 30),
                password: "password123",
            },
        });

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            instance: string;
            name: string;
        }>(response);

        expect(response.statusCode).toBe(409);
        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("UserAlreadyExistsError");
        expect(body.detail).toBe("A user with these details already exists.");
        expect(body.instance).toBe("/api/v1/auth/register");
        expect(body.name).toBe("UserAlreadyExistsError");
    });

    /**
     * This test verifies that attempting to register a second account with an already-taken
     * username results in a 409 Conflict response. A seed user is created first, then a second
     * request is made with the same username but a different email address.
     * The response is validated against the RFC 7807 error format and the UserAlreadyExistsError class.
     */
    it("should fail with 409 when the username is already taken", async () => {
        const sharedUsername = `taken_${ts}`.slice(0, 30);

        await request({
            method: "POST",
            url: "/auth/register",
            payload: {
                email: `first_${ts}@example.com`,
                username: sharedUsername,
                password: "password123",
            },
        });

        const response = await request({
            method: "POST",
            url: "/auth/register",
            payload: {
                email: `second_${ts}@example.com`,
                username: sharedUsername,
                password: "password123",
            },
        });

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            instance: string;
            name: string;
        }>(response);

        expect(response.statusCode).toBe(409);
        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("UserAlreadyExistsError");
        expect(body.detail).toBe("A user with these details already exists.");
        expect(body.instance).toBe("/api/v1/auth/register");
        expect(body.name).toBe("UserAlreadyExistsError");
    });

    /**
     * This test verifies that an invalid email format is rejected by the schema validation layer
     * before reaching the use-case. The response should be a 400 Bad Request with an RFC 7807
     * Validation Error body. The validation array must contain an entry pointing to the email
     * field with a "format" keyword violation.
     */
    it("should fail with 400 when the email format is invalid", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/register",
            payload: {
                email: "not-a-valid-email",
                username: "validuser",
                password: "password123",
            },
        });

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            instance: string;
            validation: Array<{
                instancePath: string;
                keyword: string;
                params: Record<string, unknown>;
                message: string;
            }>;
        }>(response);

        expect(response.statusCode).toBe(400);
        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("Validation Error");
        expect(body.detail).toBe("Invalid data format provided.");
        expect(body.instance).toBe("/api/v1/auth/register");
        expect(body.validation).toContainEqual(
            expect.objectContaining({
                instancePath: "/email",
                keyword: "format",
                params: { format: "email" },
            }),
        );
    });

    /**
     * This test verifies that a username shorter than the minimum allowed length of 3 characters
     * is rejected by schema validation with a 400 Bad Request response. The validation array
     * must contain an entry pointing to the username field with a "minLength" keyword violation.
     */
    it("should fail with 400 when the username is shorter than 3 characters", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/register",
            payload: {
                email: "valid@example.com",
                username: "ab",
                password: "password123",
            },
        });

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            validation: Array<{
                instancePath: string;
                keyword: string;
            }>;
        }>(response);

        expect(response.statusCode).toBe(400);
        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("Validation Error");
        expect(body.detail).toBe("Invalid data format provided.");
        expect(body.validation).toContainEqual(
            expect.objectContaining({
                instancePath: "/username",
                keyword: "minLength",
            }),
        );
    });

    /**
     * This test verifies that a password shorter than the minimum allowed length of 8 characters
     * is rejected by schema validation with a 400 Bad Request response. The validation array
     * must contain an entry pointing to the password field with a "minLength" keyword violation.
     */
    it("should fail with 400 when the password is shorter than 8 characters", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/register",
            payload: {
                email: "valid@example.com",
                username: "validuser",
                password: "short",
            },
        });

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            validation: Array<{
                instancePath: string;
                keyword: string;
            }>;
        }>(response);

        expect(response.statusCode).toBe(400);
        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("Validation Error");
        expect(body.detail).toBe("Invalid data format provided.");
        expect(body.validation).toContainEqual(
            expect.objectContaining({
                instancePath: "/password",
                keyword: "minLength",
            }),
        );
    });

    /**
     * This test verifies that a username containing characters outside the allowed pattern
     * (^[a-zA-Z0-9._]+$) is rejected by schema validation with a 400 Bad Request response.
     * Spaces and special characters such as "!" are not permitted. The validation array
     * must contain an entry pointing to the username field with a "pattern" keyword violation.
     */
    it("should fail with 400 when the username contains invalid characters", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/register",
            payload: {
                email: "valid@example.com",
                username: "invalid user!",
                password: "password123",
            },
        });

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            validation: Array<{
                instancePath: string;
                keyword: string;
            }>;
        }>(response);

        expect(response.statusCode).toBe(400);
        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("Validation Error");
        expect(body.detail).toBe("Invalid data format provided.");
        expect(body.validation).toContainEqual(
            expect.objectContaining({
                instancePath: "/username",
                keyword: "pattern",
            }),
        );
    });

    /**
     * This test verifies that a request with missing required fields is rejected by schema
     * validation with a 400 Bad Request response. Sending only an email without a username or
     * password should trigger a "required" keyword validation failure for each missing property.
     * The validation array must contain an entry for the missing "username" field.
     */
    it("should fail with 400 when required fields are missing", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/register",
            payload: {
                email: "valid@example.com",
            },
        });

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            instance: string;
            validation: Array<{
                instancePath: string;
                schemaPath: string;
                keyword: string;
                params: Record<string, unknown>;
                message: string;
            }>;
        }>(response);

        expect(response.statusCode).toBe(400);
        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("Validation Error");
        expect(body.detail).toBe("Invalid data format provided.");
        expect(body.instance).toBe("/api/v1/auth/register");
        expect(body.validation).toContainEqual(
            expect.objectContaining({
                instancePath: "",
                schemaPath: "#/required",
                keyword: "required",
                params: { missingProperty: "username" },
                message: "must have required property 'username'",
            }),
        );
    });
});
