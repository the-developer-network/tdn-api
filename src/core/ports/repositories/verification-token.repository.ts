import type {
    VerificationToken,
    TokenType,
} from "../../entities/verification-token.entity";

export interface IVerificationTokenRepository {
    upsert(data: {
        userId: string;
        tokenHash: string;
        type: TokenType;
        expiresAt: Date;
    }): Promise<VerificationToken>;
    findByUserIdAndType(
        userId: string,
        type: TokenType,
    ): Promise<VerificationToken | null>;
    delete(id: string): Promise<void>;
}
