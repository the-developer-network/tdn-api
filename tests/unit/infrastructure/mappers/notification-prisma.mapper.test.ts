import { describe, expect, it } from "vitest";
import {
    NotificationPrismaMapper,
    type PrismaNotificationItem,
} from "@infrastructure/persistence/mappers/notification-prisma.mapper";
import { Notification } from "@core/domain/entities/notification.entity";
import { NotificationType } from "@core/domain/enums/notification-type.enum";

const CDN = "https://cdn.example.com";
const now = new Date("2025-01-01T00:00:00.000Z");

function makePrismaItem(
    overrides: Partial<PrismaNotificationItem> = {},
): PrismaNotificationItem {
    return {
        id: "notif-1",
        createdAt: now,
        type: "FOLLOW" as PrismaNotificationItem["type"],
        recipientId: "user-1",
        issuerId: "user-2",
        referenceId: null,
        isRead: false,
        issuer: {
            username: "follower",
            profile: { avatarUrl: "uploads/avatar.jpg" },
        },
        ...overrides,
    };
}

describe("NotificationPrismaMapper", () => {
    describe("toDomain", () => {
        it("should return a Notification domain entity", () => {
            const result = NotificationPrismaMapper.toDomain(makePrismaItem());

            expect(result).toBeInstanceOf(Notification);
        });

        it("should map all fields to the entity correctly", () => {
            const result = NotificationPrismaMapper.toDomain(makePrismaItem());

            expect(result.recipientId).toBe("user-1");
            expect(result.issuerId).toBe("user-2");
            expect(result.username).toBe("follower");
            expect(result.isRead).toBe(false);
            expect(result.createdAt).toBe(now);
        });

        it("should cast type string to CoreNotificationType", () => {
            const result = NotificationPrismaMapper.toDomain(makePrismaItem());

            expect(result.type).toBe(NotificationType.FOLLOW);
        });

        it("should set avatarUrl from issuer profile", () => {
            const result = NotificationPrismaMapper.toDomain(makePrismaItem());

            expect(result.avatarUrl).toBe("uploads/avatar.jpg");
        });

        it("should default avatarUrl to empty string when profile is null", () => {
            const result = NotificationPrismaMapper.toDomain(
                makePrismaItem({
                    issuer: { username: "follower", profile: null },
                }),
            );

            expect(result.avatarUrl).toBe("");
        });

        it("should map referenceId when present", () => {
            const result = NotificationPrismaMapper.toDomain(
                makePrismaItem({ referenceId: "post-42" }),
            );

            expect(result.referenceId).toBe("post-42");
        });

        it("should set referenceId to undefined when DB value is null", () => {
            const result = NotificationPrismaMapper.toDomain(
                makePrismaItem({ referenceId: null }),
            );

            expect(result.referenceId).toBeUndefined();
        });
    });

    describe("toResponse — CDN URL normalization", () => {
        it("should prefix storage path with CDN URL", () => {
            const entity = NotificationPrismaMapper.toDomain(makePrismaItem());
            const result = NotificationPrismaMapper.toResponse(entity, CDN);

            expect(result.avatarUrl).toBe(`${CDN}/uploads/avatar.jpg`);
        });

        it("should not double-prefix when avatarUrl is already an http URL", () => {
            const entity = NotificationPrismaMapper.toDomain(
                makePrismaItem({
                    issuer: {
                        username: "follower",
                        profile: {
                            avatarUrl:
                                "https://lh3.googleusercontent.com/photo.jpg",
                        },
                    },
                }),
            );
            const result = NotificationPrismaMapper.toResponse(entity, CDN);

            expect(result.avatarUrl).toBe(
                "https://lh3.googleusercontent.com/photo.jpg",
            );
        });

        it("should append ?v=1 for default_profile avatars", () => {
            const entity = NotificationPrismaMapper.toDomain(
                makePrismaItem({
                    issuer: {
                        username: "follower",
                        profile: { avatarUrl: "default_profile/avatar.jpg" },
                    },
                }),
            );
            const result = NotificationPrismaMapper.toResponse(entity, CDN);

            expect(result.avatarUrl).toBe(
                `${CDN}/default_profile/avatar.jpg?v=1`,
            );
        });

        it("should fall back to default-avatar.png when avatarUrl is empty", () => {
            const entity = NotificationPrismaMapper.toDomain(
                makePrismaItem({
                    issuer: { username: "follower", profile: null },
                }),
            );
            const result = NotificationPrismaMapper.toResponse(entity, CDN);

            expect(result.avatarUrl).toBe(`${CDN}/default-avatar.png`);
        });

        it("should expose all required response fields", () => {
            const entity = NotificationPrismaMapper.toDomain(makePrismaItem());
            const result = NotificationPrismaMapper.toResponse(entity, CDN);

            expect(result.recipientId).toBe("user-1");
            expect(result.issuerId).toBe("user-2");
            expect(result.username).toBe("follower");
            expect(result.isRead).toBe(false);
            expect(result.type).toBe(NotificationType.FOLLOW);
            expect(result.createdAt).toBe(now);
        });

        it("should set referenceId as undefined when not present", () => {
            const entity = NotificationPrismaMapper.toDomain(makePrismaItem());
            const result = NotificationPrismaMapper.toResponse(entity, CDN);

            expect(result.referenceId).toBeUndefined();
        });
    });

    describe("toPrisma", () => {
        it("should map entity fields to Prisma shape", () => {
            const entity = NotificationPrismaMapper.toDomain(makePrismaItem());
            const result = NotificationPrismaMapper.toPrisma(entity);

            expect(result.recipientId).toBe("user-1");
            expect(result.issuerId).toBe("user-2");
        });

        it("should cast CoreNotificationType back to Prisma NotificationType", () => {
            const entity = NotificationPrismaMapper.toDomain(makePrismaItem());
            const result = NotificationPrismaMapper.toPrisma(entity);

            expect(result.type).toBe("FOLLOW");
        });

        it("should set referenceId to null when entity referenceId is undefined", () => {
            const entity = NotificationPrismaMapper.toDomain(
                makePrismaItem({ referenceId: null }),
            );
            const result = NotificationPrismaMapper.toPrisma(entity);

            expect(result.referenceId).toBeNull();
        });

        it("should pass referenceId through when present", () => {
            const entity = NotificationPrismaMapper.toDomain(
                makePrismaItem({ referenceId: "post-42" }),
            );
            const result = NotificationPrismaMapper.toPrisma(entity);

            expect(result.referenceId).toBe("post-42");
        });
    });
});
