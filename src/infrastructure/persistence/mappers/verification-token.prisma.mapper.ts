import { VerificationToken } from "@core/domain/entities/verification-token.entity";
import type { TokenType } from "@core/domain/enums/token-type.enum";
import type { VerificationToken as PrismaVerificationToken } from "@generated/prisma/client";

export class VerificationTokenPrismaMapper {
    static toDomain(raw: PrismaVerificationToken): VerificationToken {
        return new VerificationToken({
            id: raw.id,
            tokenHash: raw.token,
            userId: raw.userId,
            type: raw.type as TokenType,
            expiresAt: raw.expiresAt,
            createdAt: raw.createdAt,
        });
    }
}
