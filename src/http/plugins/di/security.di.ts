import { asClass, asFunction } from "awilix";
import { PasswordService } from "@infrastructure/security/password.service";
import { AuthTokenService } from "@infrastructure/security/auth-token.service";
import { CryptoService } from "@infrastructure/security/crypto.service";
import { TransactionService } from "@infrastructure/persistence/database/transaction.service";

export const securityModule = {
    // --- Services ---
    transactionService: asClass(TransactionService).singleton(),
    passwordService: asClass(PasswordService).singleton(),
    cryptoService: asClass(CryptoService).singleton(),
    authTokenService: asFunction((jwt, config) => {
        return new AuthTokenService(
            jwt,
            config.ACCESS_TOKEN_EXPIRES_IN,
            config.REFRESH_TOKEN_EXPIRES_IN,
        );
    }).singleton(),
};
