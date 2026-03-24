import { randomInt, createHash, randomBytes } from "crypto";
import type { CryptoPort } from "@core/ports/services/crypto.port";

export class CryptoService implements CryptoPort {
    generateRandomHex(bytes: number): string {
        return randomBytes(bytes).toString("hex");
    }

    generateOtp(length: number = 8): string {
        const max = Math.pow(10, length);
        const otp = randomInt(0, max).toString();
        return otp.padStart(length, "0");
    }

    hashOtp(otp: string): string {
        return createHash("sha256").update(otp).digest("hex");
    }
}
