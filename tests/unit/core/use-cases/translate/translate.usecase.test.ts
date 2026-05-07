import { beforeEach, describe, expect, it, vi } from "vitest";
import { TranslateUseCase } from "@core/use-cases/translate";
import type { TranslationPort } from "@core/ports/services/translation.port";
import type { CachePort } from "@core/ports/services/cache.port";

describe("TranslateUseCase", () => {
    let useCase: TranslateUseCase;
    let translationService: Pick<TranslationPort, "translate">;
    let cacheService: Pick<CachePort, "get" | "set">;

    beforeEach(() => {
        translationService = {
            translate: vi.fn().mockResolvedValue("Merhaba"),
        };
        cacheService = {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue(undefined),
        };
        useCase = new TranslateUseCase(
            translationService as TranslationPort,
            cacheService as CachePort,
        );
    });

    it("should return cached translation without calling translation service", async () => {
        vi.mocked(cacheService.get).mockResolvedValue("Merhaba");

        const result = await useCase.execute({
            text: "Hello",
            targetLang: "tr",
        });

        expect(result).toEqual({ translatedText: "Merhaba" });
        expect(translationService.translate).not.toHaveBeenCalled();
    });

    it("should call translation service when cache miss", async () => {
        vi.mocked(cacheService.get).mockResolvedValue(null);

        await useCase.execute({ text: "Hello", targetLang: "tr" });

        expect(translationService.translate).toHaveBeenCalledOnce();
        expect(translationService.translate).toHaveBeenCalledWith(
            "Hello",
            "TR",
        );
    });

    it("should normalize targetLang to uppercase before using", async () => {
        await useCase.execute({ text: "Hello", targetLang: "de" });

        expect(translationService.translate).toHaveBeenCalledWith(
            "Hello",
            "DE",
        );
        expect(cacheService.get).toHaveBeenCalledWith("translation:DE:Hello");
    });

    it("should store translation result in cache with correct key and TTL", async () => {
        vi.mocked(translationService.translate).mockResolvedValue("Merhaba");

        await useCase.execute({ text: "Hello", targetLang: "tr" });

        expect(cacheService.set).toHaveBeenCalledOnce();
        expect(cacheService.set).toHaveBeenCalledWith(
            "translation:TR:Hello",
            "Merhaba",
            86400,
        );
    });

    it("should return translated text from service on cache miss", async () => {
        vi.mocked(translationService.translate).mockResolvedValue("Bonjour");

        const result = await useCase.execute({
            text: "Hello",
            targetLang: "fr",
        });

        expect(result).toEqual({ translatedText: "Bonjour" });
    });

    it("should not store in cache when translation service fails", async () => {
        vi.mocked(translationService.translate).mockRejectedValue(
            new Error("Translation API error"),
        );

        await expect(
            useCase.execute({ text: "Hello", targetLang: "tr" }),
        ).rejects.toThrow("Translation API error");

        expect(cacheService.set).not.toHaveBeenCalled();
    });
});
