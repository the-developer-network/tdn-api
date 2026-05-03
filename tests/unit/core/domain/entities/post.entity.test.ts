import { describe, it, expect } from "vitest";
import { Post } from "@core/domain/entities/post.entity";
import { PostType } from "@core/domain/enums/post-type.enum";
import { PostCategory } from "@core/domain/enums/post-category-enum";

describe("Post Entity", () => {
    describe("Post.create() factory", () => {
        it("should create a post with required fields", () => {
            const post = Post.create(
                "Hello world",
                PostType.COMMUNITY,
                "author-1",
            );
            expect(post.content).toBe("Hello world");
            expect(post.type).toBe(PostType.COMMUNITY);
            expect(post.author.id).toBe("author-1");
        });

        it("should default mediaUrls to empty array", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.mediaUrls).toEqual([]);
        });

        it("should default categories to empty array", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.categories).toEqual([]);
        });

        it("should default tags to empty array", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.tags).toEqual([]);
        });

        it("should accept mediaUrls when provided", () => {
            const urls = ["https://cdn.example.com/img1.jpg"];
            const post = Post.create(
                "Content",
                PostType.COMMUNITY,
                "author-1",
                urls,
            );
            expect(post.mediaUrls).toEqual(urls);
        });

        it("should accept categories when provided", () => {
            const categories = [PostCategory.AI, PostCategory.BACKEND];
            const post = Post.create(
                "Content",
                PostType.COMMUNITY,
                "author-1",
                [],
                categories,
            );
            expect(post.categories).toEqual(categories);
        });

        it.each([
            PostType.COMMUNITY,
            PostType.TECH_NEWS,
            PostType.SYSTEM_UPDATE,
            PostType.JOB_POSTING,
        ])("should create post with type %s", (type) => {
            const post = Post.create("Content", type, "author-1");
            expect(post.type).toBe(type);
        });
    });

    describe("Getters defaults", () => {
        it("should return likeCount as 0 by default", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.likeCount).toBe(0);
        });

        it("should return isBookmarked as false by default", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.isBookmarked).toBe(false);
        });

        it("should return isLiked as false by default", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.isLiked).toBe(false);
        });
    });

    describe("hasMedia()", () => {
        it("should return false when no media is attached", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.hasMedia()).toBe(false);
        });

        it("should return true when media is attached", () => {
            const post = Post.create(
                "Content",
                PostType.COMMUNITY,
                "author-1",
                ["https://cdn.example.com/a.jpg"],
            );
            expect(post.hasMedia()).toBe(true);
        });
    });

    describe("hasTags()", () => {
        it("should return false when no tags are set", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.hasTags()).toBe(false);
        });
    });

    describe("mediaCount()", () => {
        it("should return 0 when no media", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.mediaCount()).toBe(0);
        });

        it("should return correct count when media is present", () => {
            const post = Post.create(
                "Content",
                PostType.COMMUNITY,
                "author-1",
                [
                    "https://cdn.example.com/a.jpg",
                    "https://cdn.example.com/b.jpg",
                ],
            );
            expect(post.mediaCount()).toBe(2);
        });
    });

    describe("isAuthor()", () => {
        it("should return true for the actual author", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.isAuthor("author-1")).toBe(true);
        });

        it("should return false for a different user", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            expect(post.isAuthor("other-user")).toBe(false);
        });
    });

    describe("updateContent()", () => {
        it("should update post content", () => {
            const post = Post.create(
                "Old content",
                PostType.COMMUNITY,
                "author-1",
            );
            post.updateContent("New content");
            expect(post.content).toBe("New content");
        });

        it("should update updatedAt timestamp", () => {
            const post = Post.create(
                "Old content",
                PostType.COMMUNITY,
                "author-1",
            );
            const before = new Date();
            post.updateContent("New content");
            expect(post.updatedAt.getTime()).toBeGreaterThanOrEqual(
                before.getTime(),
            );
        });
    });

    describe("addMedia()", () => {
        it("should add a media URL to the post", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            post.addMedia("https://cdn.example.com/a.jpg");
            expect(post.mediaUrls).toContain("https://cdn.example.com/a.jpg");
            expect(post.mediaCount()).toBe(1);
        });

        it("should support multiple media additions", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            post.addMedia("https://cdn.example.com/a.jpg");
            post.addMedia("https://cdn.example.com/b.jpg");
            expect(post.mediaCount()).toBe(2);
        });

        it("should update updatedAt after adding media", () => {
            const post = Post.create("Content", PostType.COMMUNITY, "author-1");
            const before = new Date();
            post.addMedia("https://cdn.example.com/a.jpg");
            expect(post.updatedAt.getTime()).toBeGreaterThanOrEqual(
                before.getTime(),
            );
        });
    });

    describe("removeMedia()", () => {
        it("should remove a specific media URL", () => {
            const post = Post.create(
                "Content",
                PostType.COMMUNITY,
                "author-1",
                [
                    "https://cdn.example.com/a.jpg",
                    "https://cdn.example.com/b.jpg",
                ],
            );
            post.removeMedia("https://cdn.example.com/a.jpg");
            expect(post.mediaUrls).not.toContain(
                "https://cdn.example.com/a.jpg",
            );
            expect(post.mediaUrls).toContain("https://cdn.example.com/b.jpg");
        });

        it("should do nothing if the URL does not exist", () => {
            const post = Post.create(
                "Content",
                PostType.COMMUNITY,
                "author-1",
                ["https://cdn.example.com/a.jpg"],
            );
            post.removeMedia("https://cdn.example.com/nonexistent.jpg");
            expect(post.mediaCount()).toBe(1);
        });

        it("should update updatedAt after removing media", () => {
            const post = Post.create(
                "Content",
                PostType.COMMUNITY,
                "author-1",
                ["https://cdn.example.com/a.jpg"],
            );
            const before = new Date();
            post.removeMedia("https://cdn.example.com/a.jpg");
            expect(post.updatedAt.getTime()).toBeGreaterThanOrEqual(
                before.getTime(),
            );
        });
    });
});
