import type { FollowUserUseCase } from "@core/use-cases/follow-user/follow-user";
import type { UnfollowUserUseCase } from "@core/use-cases/follow-user/unfollow-user";
import type { FollowUserBody } from "@typings/schemas/follow-user/follow-user.schema";
import type { FastifyRequest, FastifyReply } from "fastify";

export class FollowUserController {
    constructor(
        private readonly followUserUseCase: FollowUserUseCase,
        private readonly unfollowUserUseCase: UnfollowUserUseCase,
    ) {}

    async follow(
        request: FastifyRequest<{ Body: FollowUserBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { targetId } = request.body;
        const currentUserId = request.user!.id;

        await this.followUserUseCase.execute(currentUserId, targetId);

        reply.status(200).send({
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }

    async unfollow(
        request: FastifyRequest<{ Body: FollowUserBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { targetId } = request.body;
        const currentUserId = request.user!.id;

        await this.unfollowUserUseCase.execute(currentUserId, targetId);

        reply.status(200).send({
            meta: {
                timestamp: new Date().toISOString(),
            },
        });
    }
}
