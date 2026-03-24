import argon2 from "argon2";
import type { PasswordPort } from "@core/ports/services/password.port";

export class PasswordService implements PasswordPort {
    async hash(plain: string): Promise<string> {
        return argon2.hash(plain, {
            type: argon2.argon2i,
        });
    }

    async verify(plain: string, hash: string): Promise<boolean> {
        return argon2.verify(hash, plain);
    }
}
