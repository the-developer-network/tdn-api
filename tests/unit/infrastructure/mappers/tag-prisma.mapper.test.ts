import { describe, expect, it } from "vitest";
import { TagPrismaMapper } from "@infrastructure/persistence/mappers/tag-prisma.mapper";
import { PostType } from "@core/domain/enums/post-type.enum";

describe("TagPrismaMapper", () => {
    describe("mapPostTypeToCategory", () => {
        it("should map TECH_NEWS to Technology", () => {
            expect(
                TagPrismaMapper.mapPostTypeToCategory(PostType.TECH_NEWS),
            ).toBe("Technology");
        });

        it("should map COMMUNITY to Community", () => {
            expect(
                TagPrismaMapper.mapPostTypeToCategory(PostType.COMMUNITY),
            ).toBe("Community");
        });

        it("should map JOB_POSTING to Jobs", () => {
            expect(
                TagPrismaMapper.mapPostTypeToCategory(PostType.JOB_POSTING),
            ).toBe("Jobs");
        });

        it("should map SYSTEM_UPDATE to System", () => {
            expect(
                TagPrismaMapper.mapPostTypeToCategory(PostType.SYSTEM_UPDATE),
            ).toBe("System");
        });

        it("should return Community for unknown type strings", () => {
            expect(TagPrismaMapper.mapPostTypeToCategory("UNKNOWN_TYPE")).toBe(
                "Community",
            );
        });

        it("should return Community for empty string", () => {
            expect(TagPrismaMapper.mapPostTypeToCategory("")).toBe("Community");
        });
    });
});
