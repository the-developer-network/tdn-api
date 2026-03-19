import { BadRequestError } from "@core/errors";
import type { GetProfileUseCase } from "@core/use-cases/profile/get-profile/get-profile.usecase";
import type { SearchProfilesUseCase } from "@core/use-cases/profile/search-profile/search-profile.usecase";
import type { UpdateAvatarUseCase } from "@core/use-cases/profile/update-avatar/update-avatar.usecase";
import type { UpdateBannerUseCase } from "@core/use-cases/profile/update-banner/update-banner.use-case";
import type { UpdateProfileInput } from "@core/use-cases/profile/update-profil/update-profile-usecase.input";
import type { UpdateProfileUseCase } from "@core/use-cases/profile/update-profil/update-profile.use-case";
import ProfilePrismaMapper from "@infrastructure/mappers/profile-prisma.mapper";
import type { GetProfileParams } from "@typings/schemas/profile/get-profile.schema";
import type { SearchProfilesQuery } from "@typings/schemas/profile/search-profile.schema";
import type { FastifyRequest, FastifyReply } from "fastify";

export class ProfileController {
    constructor(
        private readonly updateAvatarUseCase: UpdateAvatarUseCase,
        private readonly updateProfileUseCase: UpdateProfileUseCase,
        private readonly updateBannerUseCase: UpdateBannerUseCase,
        private readonly getProfileUseCase: GetProfileUseCase,
        private readonly searchProfileUseCase: SearchProfilesUseCase,
        private readonly publicUrl: string,
    ) {}

    private getFullImageUrl(path: string): string {
        const baseUrl = this.publicUrl;
        return `${baseUrl}/${path}`;
    }

    async updateProfileMe(
        request: FastifyRequest<{ Body: Omit<UpdateProfileInput, "userId"> }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;
        const body = request.body;

        await this.updateProfileUseCase.execute({
            userId,
            ...body,
        });

        reply.status(204).send();
    }

    async uploadAvatarMe(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;
        const data = await request.file();

        if (!data) throw new BadRequestError("No File provided.");

        const fileBuffer = await data.toBuffer();

        const avatarUrl = await this.updateAvatarUseCase.execute({
            userId,
            fileBuffer,
            mimeType: data.mimetype,
            originalFileName: data.filename,
        });

        reply.status(200).send({
            data: {
                avatarUrl: this.getFullImageUrl(avatarUrl),
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    async uploadBannerMe(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;
        const data = await request.file();

        if (!data) throw new BadRequestError("No File provided.");

        const fileBuffer = await data.toBuffer();

        const bannerUrl = await this.updateBannerUseCase.execute({
            userId,
            fileBuffer,
            mimeType: data.mimetype,
            originalFileName: data.filename,
        });

        reply.status(200).send({
            data: {
                bannerUrl: this.getFullImageUrl(bannerUrl),
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    async getProfile(
        request: FastifyRequest<{ Params: GetProfileParams }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { username } = request.params;

        const currentUserId = request.user?.id;

        const { profile, isMe, isFollowing } =
            await this.getProfileUseCase.execute(username, currentUserId);

        const profileData = ProfilePrismaMapper.toResponse(profile);

        reply.status(200).send({
            data: {
                ...profileData,
                isMe,
                isFollowing,
                avatarUrl: this.getFullImageUrl(profileData.avatarUrl),
                bannerUrl: this.getFullImageUrl(profileData.bannerUrl),
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    async searchProfiles(
        request: FastifyRequest<{ Querystring: SearchProfilesQuery }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { q, limit } = request.query;
        const currentUserId = request.user?.id;

        const results = await this.searchProfileUseCase.execute(
            q,
            currentUserId,
            limit,
        );

        const responseData = results.map(({ profile, isMe }) => {
            const profileData = ProfilePrismaMapper.toResponse(profile);

            return {
                ...profileData,
                isMe,
                avatarUrl: this.getFullImageUrl(profileData.avatarUrl),
                bannerUrl: this.getFullImageUrl(profileData.bannerUrl),
            };
        });

        reply.status(200).send({
            data: responseData,
            meta: {
                timestamp: new Date().toISOString(),
                count: responseData.length,
            },
        });
    }
}
