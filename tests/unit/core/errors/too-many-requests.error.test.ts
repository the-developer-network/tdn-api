import { describe, it, expect } from "vitest";
import { TooManyRequestsError, CustomError } from "@core/errors";

describe("Too Many Request Error", () => {
    describe("Constructor", () => {
        it("Should initialize with the correct message, status code 429, and class name.", () => {
            const errorMessage = "Too many requests, please try again later.";

            const error = new TooManyRequestsError(errorMessage);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(CustomError);
            expect(error).toBeInstanceOf(TooManyRequestsError);

            expect(error.message).toBe(errorMessage);
            expect(error.statusCode).toBe(429);
            expect(error.name).toBe("TooManyRequestsError");
        });
    });
});
