import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    type UpdateProfileBody,
    UpdateProfileBodySchema,
} from "@typings/schemas/profile/update-profile.schema";
import type { FastifyInstance } from "fastify";

function profileRoutes(fastify: FastifyInstance): void {
    const profileController = fastify.diContainer.cradle.profileController;

    fastify.patch(
        "/me/avatar",
        {
            onRequest: [fastify.authenticate],
            config: {
                rateLimit: RateLimitPolicies.STRICT,
            },
        },
        profileController.uploadAvatarMe.bind(profileController),
    );

    fastify.patch(
        "/me/banner",
        {
            onRequest: [fastify.authenticate],
            config: {
                rateLimit: RateLimitPolicies.STRICT,
            },
        },
        profileController.uploadBannerMe.bind(profileController),
    );

    fastify.patch<{ Body: UpdateProfileBody }>(
        "/me",
        {
            schema: {
                body: UpdateProfileBodySchema,
            },
            onRequest: [fastify.authenticate],
        },
        profileController.updateProfileMe.bind(profileController),
    );
}

export default profileRoutes;
