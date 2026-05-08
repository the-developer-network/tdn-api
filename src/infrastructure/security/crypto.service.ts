import {
    randomInt,
    createHash,
    randomBytes,
    timingSafeEqual as cryptoTimingSafeEqual,
} from "crypto";
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

    timingSafeEqual(a: string, b: string): boolean {
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);
        if (bufA.length !== bufB.length) return false;
        return cryptoTimingSafeEqual(bufA, bufB);
    }
}
