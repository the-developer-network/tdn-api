import type {
    ITagRepository,
    TrendItem,
    TrendingParams,
} from "@core/ports/repositories/tag.repository";
import type { PrismaTransactionalClient } from "@infrastructure/persistence/database/prisma-client.type";
import type { PostType } from "@core/domain/enums/post-type.enum";

const POST_TYPE_CATEGORY_MAP: Record<string, string> = {
    TECH_NEWS: "Technology",
    COMMUNITY: "Community",
    JOB_POSTING: "Jobs",
    SYSTEM_UPDATE: "System",
};

export function mapPostTypeToCategory(type: PostType | string): string {
    if (!type) return "Community";
    const key = String(type).toUpperCase();
    return POST_TYPE_CATEGORY_MAP[key] ?? "Community";
}

export class PrismaTagRepository implements ITagRepository {
    constructor(private readonly prisma: PrismaTransactionalClient) {}

    async findTrending(params: TrendingParams): Promise<TrendItem[]> {
        const { limit, windowDays } = params;
        const windowStart = new Date(
            Date.now() - windowDays * 24 * 60 * 60 * 1000,
        );

        const rawTags = await this.prisma.tag.findMany({
            where: {
                posts: {
                    some: { createdAt: { gte: windowStart } },
                },
            },
            include: {
                posts: {
                    where: { createdAt: { gte: windowStart } },
                    select: { type: true },
                },
            },
            orderBy: {
                posts: { _count: "desc" },
            },
            take: limit,
        });

        return rawTags.map((tag): TrendItem => {
            const postCount = tag.posts.length;
            const topCategory = this.computeTopCategory(
                tag.posts.map((p) => p.type),
            );
            return {
                tag: tag.name,
                postCount,
                category: topCategory ?? tag.category,
            };
        });
    }

    private computeTopCategory(types: string[]): string | null {
        if (types.length === 0) return null;
        const freq: Record<string, number> = {};
        for (const t of types) {
            freq[t] = (freq[t] ?? 0) + 1;
        }
        const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
        return mapPostTypeToCategory(dominant);
    }
}
