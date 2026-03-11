import { describe, it, expect } from "vitest";
import { CustomError } from "@core/errors/custom.error";

class TestError extends CustomError {
    constructor(message: string, statusCode?: number) {
        super(message, statusCode);
    }
}

describe("Custom Error (Base Class)", () => {
    describe("Constructor", () => {
        it("Should set the message, default status code (500), and correct class name.", () => {
            /** Arrange */
            const errorMessage = "An unexpected test error occurred";

            /** Act */
            const error = new TestError(errorMessage);

            /** Assert */
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(CustomError);
            expect(error.message).toBe(errorMessage);
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe("TestError");
        });

        it("Should set a custom status code when provided.", () => {
            /** Arrange */
            const errorMessage = "Custom status test";
            const customStatusCode = 418;

            /** Act */
            const error = new TestError(errorMessage, customStatusCode);

            /** Assert */
            expect(error.statusCode).toBe(customStatusCode);
            expect(error.message).toBe(errorMessage);
        });

        it("Should capture the stack trace.", () => {
            /** Arrange */
            const errorMessage = "Stack trace validation";

            /** Act */
            const error = new TestError(errorMessage);

            /** Assert */
            expect(error.stack).toBeDefined();
            expect(typeof error.stack).toBe("string");
            expect(error.stack).toContain("TestError");
        });
    });
});
