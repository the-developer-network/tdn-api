import { describe, it, expect } from "vitest";
import { UserAlreadyExistsError, CustomError } from "@core/errors";

describe("Unauthorized Error", () => {
    describe("Constructor", () => {
        it("Should initialize with the correct message, status code 409, and class name.", () => {
            const errorMessage = "A user with these details already exists.";

            const error = new UserAlreadyExistsError(errorMessage);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(CustomError);
            expect(error).toBeInstanceOf(UserAlreadyExistsError);

            expect(error.message).toBe(errorMessage);
            expect(error.statusCode).toBe(409);
            expect(error.name).toBe("UserAlreadyExistsError");
        });
    });
});
