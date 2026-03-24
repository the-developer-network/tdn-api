import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    type FollowUserBody,
    FollowUserBodySchema,
} from "@typings/schemas/follow-user/follow-user.schema";
import type { FastifyInstance } from "fastify";

export default function followRoutes(fastify: FastifyInstance): void {
    const followController = fastify.diContainer.cradle.followUserController;

    fastify.post<{ Body: FollowUserBody }>(
        "/",
        {
            schema: {
                body: FollowUserBodySchema,
                tags: ["Follow"],
            },
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        followController.follow.bind(followController),
    );

    fastify.delete<{ Body: FollowUserBody }>(
        "/",
        {
            schema: {
                body: FollowUserBodySchema,
                tags: ["Follow"],
            },
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.SENSITIVE },
        },
        followController.unfollow.bind(followController),
    );
}
