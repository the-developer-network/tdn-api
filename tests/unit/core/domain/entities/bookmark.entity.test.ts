import { describe, it, expect } from "vitest";
import { Bookmark } from "@core/domain/entities/bookmark.entity";

describe("Bookmark Entity", () => {
    describe("Bookmark.create() factory", () => {
        it("should create a bookmark instance", () => {
            const bookmark = Bookmark.create("post-1", "user-1");
            expect(bookmark).toBeInstanceOf(Bookmark);
        });

        it("should create a bookmark with different post and user IDs", () => {
            const bookmark = Bookmark.create("post-99", "user-42");
            expect(bookmark).toBeInstanceOf(Bookmark);
        });
    });
});
