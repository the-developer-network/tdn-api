import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchTagsUseCase } from "@core/use-cases/tag/search-tag";
import type { ITagRepository } from "@core/ports/repositories/tag.repository";

const mockTags = [
    { name: "typescript", postCount: 42, category: "programming" },
    { name: "typeorm", postCount: 10, category: null },
];

describe("SearchTagsUseCase", () => {
    let useCase: SearchTagsUseCase;
    let tagRepository: Pick<ITagRepository, "search">;

    beforeEach(() => {
        tagRepository = {
            search: vi.fn().mockResolvedValue(mockTags),
        };
        useCase = new SearchTagsUseCase(tagRepository as ITagRepository);
    });

    it("should return empty array when query is empty string", async () => {
        const result = await useCase.execute({ query: "" });

        expect(result).toEqual([]);
        expect(tagRepository.search).not.toHaveBeenCalled();
    });

    it("should return empty array when query is whitespace only", async () => {
        const result = await useCase.execute({ query: "   " });

        expect(result).toEqual([]);
        expect(tagRepository.search).not.toHaveBeenCalled();
    });

    it("should trim the query before passing to repository", async () => {
        await useCase.execute({ query: "  typescript  ", limit: 5 });

        expect(tagRepository.search).toHaveBeenCalledWith("typescript", 5);
    });

    it("should return mapped tag results for a valid query", async () => {
        const result = await useCase.execute({ query: "type", limit: 10 });

        expect(result).toEqual([
            { name: "typescript", postCount: 42, category: "programming" },
            { name: "typeorm", postCount: 10, category: null },
        ]);
    });

    it("should pass limit to repository", async () => {
        await useCase.execute({ query: "ts", limit: 20 });

        expect(tagRepository.search).toHaveBeenCalledWith("ts", 20);
    });

    it("should return empty array when repository returns no results", async () => {
        vi.mocked(tagRepository.search).mockResolvedValue([]);

        const result = await useCase.execute({ query: "notfound" });

        expect(result).toEqual([]);
    });

    it("should propagate repository errors", async () => {
        vi.mocked(tagRepository.search).mockRejectedValue(
            new Error("Database error"),
        );

        await expect(useCase.execute({ query: "typescript" })).rejects.toThrow(
            "Database error",
        );
    });
});
