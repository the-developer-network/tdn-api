import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
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
}

export default profileRoutes;
