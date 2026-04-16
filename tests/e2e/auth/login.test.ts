import { parseBody, request } from "../setup";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * This test suite is designed to validate the authentication flow of the application,
 * specifically focusing on the login functionality. It will test the successful login scenario where a user provides valid credentials and
 * receives an access token and refresh token in response. The test will also check that the refresh token is set as an HTTP-only cookie and
 * that the response contains the expected user information and metadata. Additionally, it will ensure that the server responds
 * with the correct status code and structure for a successful login attempt.
 */
describe("POST /auth/login - Authentication Flow", () => {
    /**
     * This test suite verifies the authentication flow of the application, specifically focusing on the login functionality.
     * It tests the successful login scenario where a user provides valid credentials and receives an access token and refresh token in response.
     * The test also checks that the refresh token is set as an
     * HTTP-only cookie and that the response contains the expected user information and metadata. Additionally,
     * it ensures that the server responds with the correct status code and structure for a successful login attempt.
     */
    const user = {
        email: "test@example.com",
        password: "password123",
        username: "testuser",
    };

    /**
     * Before all tests in this suite, we register a new user using the /auth/register endpoint.
     * This ensures that we have a valid user in the system to test the login functionality against.
     * The registration is done by sending a POST request with the user's email, password, and username as the payload.
     * This setup step is crucial for the subsequent login test to succeed, as it relies on the existence of this user in the database.
     */
    beforeAll(async () => {
        await request({
            method: "POST",
            url: "/auth/register",
            payload: user,
        });
    });

    /**
     * This test verifies that a user can successfully log in with valid credentials.
     * It sends a POST request to the /auth/login endpoint with the user's email and password.
     * The test then checks that the response status code is 201, indicating a successful login.
     * It also validates that the response body contains the expected data, including an access token,
     * expiration time, and user information. Additionally, it ensures that the refresh token is set as an HTTP-only cookie.
     */
    it("should successfully log in with valid credentials", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/login",
            payload: {
                identifier: user.email,
                password: user.password,
            },
        });
        const body = parseBody<{ data: { user: unknown }; meta: unknown }>(
            response,
        );
        /**
         * The assertions in this test validate the structure and content of the response from the /auth/login endpoint.
         * It checks that the status code is 201, indicating a successful login.
         * The test also verifies that the response body contains a "data" property with an "accessToken", "expiresAt", and "user" object. The user object is further checked to ensure it has the correct "id", "username", and "isEmailVerified" properties. Finally, it confirms that the response includes a "meta" property with a "timestamp". These assertions ensure that the login functionality is working as expected and that the response contains all necessary information for a successful authentication flow.
         */
        expect(response.statusCode).toBe(201);
        expect(body.data).toHaveProperty("accessToken");
        expect(body.data).toHaveProperty("expiresAt");
        expect(body.data).toHaveProperty("user");
        expect(body.data.user).toHaveProperty("id");
        expect(body.data.user).toHaveProperty("username", user.username);
        expect(body.data.user).toHaveProperty("isEmailVerified", false);
        expect(body.meta).toHaveProperty("timestamp", expect.any(String));
        /**
         * This part of the test checks that the refresh token is set as an HTTP-only cookie in the response headers. It retrieves the "set-cookie"
         * header from the response and verifies that it contains a cookie named "refreshToken" with the appropriate attributes, such as
         * "HttpOnly", "Path=/", and "SameSite=Lax". This ensures that the refresh token is securely stored in the
         * client's browser and is not accessible via JavaScript, which is crucial for preventing cross-site scripting (XSS)
         * attacks and ensuring the security of the authentication flow.
         */
        const cookies = response.headers["set-cookie"];

        const cookieArray: string[] = Array.isArray(cookies)
            ? cookies
            : typeof cookies === "string"
              ? [cookies]
              : [];

        const refreshTokenCookie = cookieArray.find((c) =>
            c.startsWith("refreshToken="),
        );

        expect(cookies).toBeDefined();
        expect(refreshTokenCookie).toBeDefined();
        expect(refreshTokenCookie).toContain("HttpOnly");
        expect(refreshTokenCookie).toContain("Path=/");
        expect(refreshTokenCookie).toContain("SameSite=Lax");
    });

    /**
     * This test verifies that the login endpoint correctly handles invalid credentials.
     * It sends a POST request to the /auth/login endpoint with the user's email and an incorrect password.
     * The test then checks that the response status code is 401, indicating an unauthorized access attempt.
     * It also validates that the response body contains specific properties that describe the error, such as
     * "type", "title", "detail", "instance", and "name". These properties should indicate that the error is an
     * "InvalidCredentialsError" with a message stating "Invalid username/email or password".
     * This ensures that the application correctly handles authentication failures and provides meaningful error messages to the client.
     */
    it("should fail to log in with invalid credentials", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/login",
            payload: {
                identifier: user.email,
                password: "wrongpassword",
            },
        });

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            instance: string;
            name: string;
        }>(response);
        /**
         * The assertions in this test validate the response from the /auth/login endpoint when invalid credentials are provided. It checks that the status code is 401, indicating an unauthorized access attempt. The test also verifies that the response body contains specific properties that describe the error, such as
         * "type", "title", "detail", "instance", and "name".
         * These properties should indicate that the error is an "InvalidCredentialsError" with a message stating "Invalid username/email or password".
         * This ensures that the application correctly handles authentication failures and provides meaningful error messages to the client.
         */
        expect(response.statusCode).toBe(401);
        expect(body.type).toBe("about:blank");
        expect(body.title).toBe("InvalidCredentialsError");
        expect(body.detail).toBe("Invalid username/email or password");
        expect(body.instance).toBe("/api/v1/auth/login");
        expect(body.name).toBe("InvalidCredentialsError");
    });

    /**
     * This test verifies that the login endpoint correctly handles requests with missing required fields. It sends a POST request to the
     * /auth/login endpoint with only the user's email and omits the password.
     * The test then checks that the response status code is 400, indicating a bad request due to invalid input.
     * It also validates that the response body contains specific properties that describe the error, such as
     * "type", "title", "detail", "instance", "name", and a "validation" array.
     * The validation array should contain an entry indicating that the "password" field is missing, with details about the validation error.
     * This ensures that the application correctly validates input and provides meaningful error messages when required fields are missing.
     */
    it("should fail to log in with missing fields", async () => {
        const response = await request({
            method: "POST",
            url: "/auth/login",
            payload: {
                identifier: user.email,
            },
        });

        const body = parseBody<{
            type: string;
            title: string;
            detail: string;
            instance: string;
            name: string;
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
        expect(body.instance).toBe("/api/v1/auth/login");
        expect(body.validation).toBeDefined();
        expect(body.validation).toContainEqual(
            expect.objectContaining({
                instancePath: "",
                schemaPath: "#/required",
                keyword: "required",
                params: { missingProperty: "password" },
                message: "must have required property 'password'",
            }),
        );
    });
});
