import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedError } from "@core/errors";
import { authHook } from "@hooks/auth.hook";

// --- Helpers ---
function buildMockRequest(
    overrides?: Partial<{ jwtVerify: () => Promise<void> }>,
) {
    return {
        jwtVerify: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    } as any;
}

// --- Tests ---
describe("authHook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Success", () => {
        it("should call request.jwtVerify()", async () => {
            const request = buildMockRequest();

            await authHook(request);

            expect(request.jwtVerify).toHaveBeenCalledOnce();
        });

        it("should resolve without throwing when jwtVerify succeeds", async () => {
            const request = buildMockRequest();

            await expect(authHook(request)).resolves.toBeUndefined();
        });
    });

    describe("Failure", () => {
        it("should throw UnauthorizedError when jwtVerify rejects", async () => {
            const request = buildMockRequest({
                jwtVerify: vi
                    .fn()
                    .mockRejectedValue(new Error("invalid token")),
            });

            await expect(authHook(request)).rejects.toThrow(UnauthorizedError);
        });

        it("should throw UnauthorizedError when jwtVerify throws synchronously", async () => {
            const request = buildMockRequest({
                jwtVerify: vi.fn().mockImplementation(() => {
                    throw new Error("jwt malformed");
                }),
            });

            await expect(authHook(request)).rejects.toThrow(UnauthorizedError);
        });

        it("should NOT propagate the original jwtVerify error", async () => {
            const originalError = new Error("token expired");
            const request = buildMockRequest({
                jwtVerify: vi.fn().mockRejectedValue(originalError),
            });

            await expect(authHook(request)).rejects.not.toThrow(
                "token expired",
            );
        });

        it("should throw UnauthorizedError regardless of the underlying error type", async () => {
            const errors = [
                new Error("expired"),
                new TypeError("invalid"),
                new RangeError("out of range"),
                "string error",
            ];

            for (const err of errors) {
                const request = buildMockRequest({
                    jwtVerify: vi.fn().mockRejectedValue(err),
                });

                await expect(authHook(request)).rejects.toThrow(
                    UnauthorizedError,
                );
            }
        });
    });
});
