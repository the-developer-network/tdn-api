/**
 * Follow routes module
 *
 * This module defines API endpoints for user follow/unfollow functionality.
 * Provides endpoints to follow and unfollow other users in the system.
 *
 * @author TDN Team
 * @version 1.0.0
 */

import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    type FollowUserBody,
    FollowUserBodySchema,
} from "@typings/schemas/follow-user/follow-user.schema";
import type { FastifyInstance } from "fastify";

/**
 * Sets up follow/unfollow routes on the Fastify instance
 *
 * @param fastify - The Fastify application instance
 * @returns void
 */
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
