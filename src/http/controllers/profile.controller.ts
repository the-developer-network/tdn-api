import { BadRequestError } from "@core/errors";
import type { UpdateAvatarUseCase } from "@core/use-cases/profile/update-avatar.usecase";
import type { FastifyRequest, FastifyReply } from "fastify";

export class ProfileController {
    constructor(private readonly updateAvatarUseCase: UpdateAvatarUseCase) {}

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
}
