import { describe, it, expect } from "vitest";
import { UnauthorizedError, CustomError } from "@core/errors";

describe("Unauthorized Error", () => {
    describe("Constructor", () => {
        it("Should initialize with the correct message, status code 401, and class name.", () => {
            const errorMessage = "Missing or invalid authentication token";

            const error = new UnauthorizedError(errorMessage);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(CustomError);
            expect(error).toBeInstanceOf(UnauthorizedError);

            expect(error.message).toBe(errorMessage);
            expect(error.statusCode).toBe(401);
            expect(error.name).toBe("UnauthorizedError");
        });
    });
});
