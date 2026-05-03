import { describe, it, expect } from "vitest";
import { Comment } from "@core/domain/entities/comment.entity";
import type { CommentProps } from "@core/domain/interfaces/comment-props.interface";

describe("Comment Entity", () => {
    describe("Comment.create() factory", () => {
        it("should create a top-level comment with required fields", () => {
            const comment = Comment.create("Great post!", "post-1", "user-1");
            expect(comment.content).toBe("Great post!");
            expect(comment.postId).toBe("post-1");
            expect(comment.authorId).toBe("user-1");
        });

        it("should default parentId to null for top-level comments", () => {
            const comment = Comment.create("Top-level", "post-1", "user-1");
            expect(comment.parentId).toBeNull();
        });

        it("should set parentId for nested replies", () => {
            const comment = Comment.create(
                "Reply!",
                "post-1",
                "user-1",
                "parent-comment-1",
            );
            expect(comment.parentId).toBe("parent-comment-1");
        });

        it("should default mediaUrls to empty array", () => {
            const comment = Comment.create("Content", "post-1", "user-1");
            expect(comment.mediaUrls).toEqual([]);
        });

        it("should accept mediaUrls when provided", () => {
            const urls = ["https://cdn.example.com/img.jpg"];
            const comment = Comment.create(
                "Content",
                "post-1",
                "user-1",
                null,
                urls,
            );
            expect(comment.mediaUrls).toEqual(urls);
        });
    });

    describe("Getters defaults", () => {
        it("should return likeCount as 0 by default", () => {
            const comment = Comment.create("Content", "post-1", "user-1");
            expect(comment.likeCount).toBe(0);
        });

        it("should return replyCount as 0 by default", () => {
            const comment = Comment.create("Content", "post-1", "user-1");
            expect(comment.replyCount).toBe(0);
        });

        it("should return isLiked as false by default", () => {
            const comment = Comment.create("Content", "post-1", "user-1");
            expect(comment.isLiked).toBe(false);
        });

        it("should return isBookmarked as false by default", () => {
            const comment = Comment.create("Content", "post-1", "user-1");
            expect(comment.isBookmarked).toBe(false);
        });

        it("should return author as undefined when not populated", () => {
            const comment = Comment.create("Content", "post-1", "user-1");
            expect(comment.author).toBeUndefined();
        });
    });

    describe("Comment.with() factory", () => {
        const baseProps: CommentProps = {
            id: "comment-1",
            content: "Existing comment",
            postId: "post-1",
            authorId: "user-1",
            parentId: null,
            mediaUrls: [],
            likeCount: 5,
            replyCount: 2,
            isLiked: true,
            isBookmarked: false,
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
        };

        it("should create a comment from existing props", () => {
            const comment = Comment.with(baseProps);
            expect(comment.id).toBe("comment-1");
            expect(comment.content).toBe("Existing comment");
        });

        it("should return correct likeCount from props", () => {
            const comment = Comment.with(baseProps);
            expect(comment.likeCount).toBe(5);
        });

        it("should return correct replyCount from props", () => {
            const comment = Comment.with(baseProps);
            expect(comment.replyCount).toBe(2);
        });

        it("should return isLiked from props", () => {
            const comment = Comment.with(baseProps);
            expect(comment.isLiked).toBe(true);
        });

        it("should return correct createdAt and updatedAt", () => {
            const comment = Comment.with(baseProps);
            expect(comment.createdAt).toEqual(new Date("2024-01-01T00:00:00Z"));
            expect(comment.updatedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
        });

        it("should populate author details when provided", () => {
            const comment = Comment.with({
                ...baseProps,
                author: {
                    id: "user-1",
                    username: "johndoe",
                    avatarUrl: "https://cdn.example.com/avatar.jpg",
                    fullName: "John Doe",
                },
            });
            expect(comment.author).toBeDefined();
            expect(comment.author!.username).toBe("johndoe");
            expect(comment.author!.fullName).toBe("John Doe");
        });

        it("should handle reply (parentId set) via with()", () => {
            const comment = Comment.with({
                ...baseProps,
                parentId: "parent-1",
            });
            expect(comment.parentId).toBe("parent-1");
        });
    });
});
