import { describe, it, expect } from "vitest";
import { BadRequestError } from "@core/errors/bad-request.error";
import { CustomError } from "@core/errors/custom.error";

describe("Bad Request Error", () => {
    describe("Constructor", () => {
        it("Should initialize with the correct message, status code 400, and class name.", () => {
            /** Arrange */
            const errorMessage = "Invalid input data provided.";

            /** Act */
            const error = new BadRequestError(errorMessage);

            /** Assert */
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(CustomError);
            expect(error).toBeInstanceOf(BadRequestError);

            expect(error.message).toBe(errorMessage);
            expect(error.statusCode).toBe(400);
            expect(error.name).toBe("BadRequestError");
        });
    });
});
