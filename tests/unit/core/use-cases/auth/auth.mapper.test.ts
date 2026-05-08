import { describe, expect, it } from "vitest";
import { AuthMapper } from "@core/use-cases/auth/auth.mapper";
import type { UserPayload } from "@core/ports/services/auth-token.port";

describe("AuthMapper", () => {
    const userPayload: UserPayload = {
        id: "user-1",
        username: "testuser",
    };

    const tokenData = {
        accessToken: "access_token",
        expiresAt: 1000,
        refreshToken: "refresh_token",
        refreshTokenExpiresAt: 2000,
    };

    describe("toUserOutput", () => {
        it("should map id and username", () => {
            const result = AuthMapper.toUserOutput(userPayload);

            expect(result).toEqual({ id: "user-1", username: "testuser" });
        });

        it("should only expose id and username — no extra fields", () => {
            const result = AuthMapper.toUserOutput(userPayload);

            expect(Object.keys(result)).toStrictEqual(["id", "username"]);
        });
    });

    describe("toTokenOutput", () => {
        it("should map all token fields correctly", () => {
            const result = AuthMapper.toTokenOutput(tokenData);

            expect(result).toEqual(tokenData);
        });

        it("should expose exactly the expected token fields", () => {
            const result = AuthMapper.toTokenOutput(tokenData);

            expect(Object.keys(result)).toStrictEqual([
                "accessToken",
                "expiresAt",
                "refreshToken",
                "refreshTokenExpiresAt",
            ]);
        });
    });

    describe("toAuthOutput", () => {
        it("should compose user and token output correctly", () => {
            const result = AuthMapper.toAuthOutput({
                user: userPayload,
                ...tokenData,
            });

            expect(result.user).toEqual({ id: "user-1", username: "testuser" });
            expect(result.tokens).toEqual(tokenData);
        });

        it("should not leak extra user fields into the response", () => {
            const result = AuthMapper.toAuthOutput({
                user: userPayload,
                ...tokenData,
            });

            expect(Object.keys(result.user)).toStrictEqual(["id", "username"]);
        });
    });
});
