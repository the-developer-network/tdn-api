import type { UserPayload } from "../interfaces/user-payload.interface";

export interface TokenResult {
    accessToken: string;
    expiresAt: number;
}

export interface TokenPort {
    generate(payload: UserPayload): TokenResult;
    verify(token: string): UserPayload;
}
