export enum PostType {
    COMMUNITY = "COMMUNITY",
    TECH_NEWS = "TECH_NEWS",
    SYSTEM_UPDATE = "SYSTEM_UPDATE",
    JOB_POSTING = "JOB_POSTING",
}

export interface CreatePostInput {
    content: string;
    type: PostType;
    mediaUrls?: string[];
    authorId: string;
}

export interface GetPostsParams {
    page: number;
    limit: number;
    type?: PostType;
}
export interface PostOutput {
    id: string;
    content: string;
    type: PostType;
    mediaUrls: string[];
    author: {
        id: string;
        username: string;
        avatarUrl: string;
    };
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginatedPosts {
    posts: PostOutput[];
    total: number;
}

export interface IPostRepository {
    create(data: CreatePostInput): Promise<void>;
    findAll(params: GetPostsParams): Promise<PaginatedPosts>;
    findById(id: string): Promise<PostOutput | null>;
    delete(id: string): Promise<void>;
}
