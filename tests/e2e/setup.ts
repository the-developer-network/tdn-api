import { beforeAll, afterAll } from "vitest";
import { App } from "../../src/app";
import type {
    FastifyInstance,
    InjectOptions,
    LightMyRequestResponse,
} from "fastify";

/**
 * This module sets up the testing environment for end-to-end tests by initializing a Fastify server instance before all tests and closing it afterward. It also provides utility functions to send HTTP requests to the server and parse responses.
 */
export let server: FastifyInstance;
/**
 * The Fastify application instance used for testing. It is initialized before all tests and closed afterward to ensure a clean testing environment.
 */
export let app: App;
/**
 * The prefix for all API routes in the Fastify server. This is used to automatically prefix URLs in the request utility functions, ensuring that all requests are sent to the correct endpoint.
 */
export const API_PREFIX = "/api/v1";

/**
 * Initializes the Fastify server instance before all tests. This function creates a new instance of the App class, initializes it, and assigns the server instance to the `server` variable for use in tests.
 * After all tests are completed, the server instance is closed to free up resources and ensure a clean state for any subsequent tests.
 */
beforeAll(async () => {
    app = new App();
    await app.init();
    server = app.instance;
});

/**
 * Closes the Fastify server instance after all tests have completed. This is important to free up resources and ensure that the server does not continue running after the tests are finished, which could interfere with other tests or applications.
 * This function is called automatically by the testing framework after all tests in the suite have been executed.
 */
afterAll(async () => {
    await app.close();
});

/**
 * Sends an HTTP request to the Fastify server using LightMyRequest.
 * Automatically prefixes the URL with the API prefix.
 * @param opts - The options for the request, excluding the URL which is prefixed automatically.
 * @returns A promise that resolves to the LightMyRequestResponse.
 */
export function request(
    opts: Omit<InjectOptions, "url"> & { url: string },
): Promise<LightMyRequestResponse> {
    return server.inject({ ...opts, url: `${API_PREFIX}${opts.url}` });
}

/**
 * Sends an authenticated HTTP request to the Fastify server using LightMyRequest.
 * Automatically prefixes the URL with the API prefix and includes the Bearer token in the Authorization header.
 * @param token - The Bearer token for authentication.
 * @param opts - The options for the request, excluding the URL which is prefixed automatically.
 * @returns A promise that resolves to the LightMyRequestResponse.
 */
export function authRequest(
    token: string,
    opts: Omit<InjectOptions, "url"> & { url: string },
): Promise<LightMyRequestResponse> {
    return request({
        ...opts,
        headers: { ...opts.headers, authorization: `Bearer ${token}` },
    });
}

/**
 * Parses the JSON body from a LightMyRequestResponse.
 * @param response - The LightMyRequestResponse to parse.
 * @returns The parsed JSON body.
 */
export function parseBody<T = Record<string, unknown>>(
    response: LightMyRequestResponse,
): T {
    return response.json() as T;
}

/**
 * Extracts the refreshToken cookie from a response's Set-Cookie header,
 * URL-decodes the value, and returns a Cookie header string ready to use in
 * subsequent inject requests (e.g. `refreshToken=s:token.hmac`).
 *
 * Background: `@fastify/cookie` serialises the signed value with
 * `encodeURIComponent` in the Set-Cookie header, but the incoming Cookie
 * header must carry the raw (decoded) value so that `unsignCookie` can
 * verify the HMAC correctly.
 *
 * @param response - The response containing the Set-Cookie header.
 * @returns A cookie string like `refreshToken=s:token.hmac`, or an empty
 *          string if no refreshToken cookie is present.
 */
export function extractRefreshTokenCookie(
    response: LightMyRequestResponse,
): string {
    const setCookieHeader = response.headers["set-cookie"];
    const cookieArray = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : [setCookieHeader ?? ""];

    const rawCookie = cookieArray.find((c) =>
        c.trim().toLowerCase().startsWith("refreshtoken="),
    );

    if (!rawCookie) return "";

    const nameValue = rawCookie.split(";")[0].trim();
    const eqIdx = nameValue.indexOf("=");
    const name = nameValue.slice(0, eqIdx);
    const encodedValue = nameValue.slice(eqIdx + 1);

    return `${name}=${decodeURIComponent(encodedValue)}`;
}
