import { BadRequestError } from "@core/errors";
import type { UpdateAvatarUseCase } from "@core/use-cases/profile/update-avatar/update-avatar.usecase";
import type { UpdateBannerUseCase } from "@core/use-cases/profile/update-banner/update-banner.use-case";
import type { UpdateProfileInput } from "@core/use-cases/profile/update-profil/update-profile-usecase.input";
import type { UpdateProfileUseCase } from "@core/use-cases/profile/update-profil/update-profile.use-case";
import type { FastifyRequest, FastifyReply } from "fastify";

export class ProfileController {
    constructor(
        private readonly updateAvatarUseCase: UpdateAvatarUseCase,
        private readonly updateProfileUseCase: UpdateProfileUseCase,
        private readonly updateBannerUseCase: UpdateBannerUseCase,
    ) {}

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
                avatarUrl,
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
                bannerUrl,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }
}
