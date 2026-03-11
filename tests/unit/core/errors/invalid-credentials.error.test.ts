import { describe, it, expect } from "vitest";
import { InvalidCredentialsError, CustomError } from "@core/errors";

describe("Invalid Credentials Error", () => {
    describe("Constructor", () => {
        it("Should initialize with the correct message, status code 401, and class name.", () => {
            const errorMessage = "Invalid username/email or password";

            const error = new InvalidCredentialsError(errorMessage);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(CustomError);
            expect(error).toBeInstanceOf(InvalidCredentialsError);

            expect(error.message).toBe(errorMessage);
            expect(error.statusCode).toBe(401);
            expect(error.name).toBe("InvalidCredentialsError");
        });
    });
});
