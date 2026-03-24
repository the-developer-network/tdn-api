import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    FollowersParamsSchema,
    PaginationQuerySchema,
} from "@typings/schemas/profile/followers.schema";
import {
    type GetProfileParams,
    GetProfileParamsSchema,
} from "@typings/schemas/profile/get-profile.schema";
import {
    type SearchProfilesQuery,
    SearchProfilesQuerySchema,
} from "@typings/schemas/profile/search-profile.schema";
import {
    type UpdateProfileBody,
    UpdateProfileBodySchema,
} from "@typings/schemas/profile/update-profile.schema";
import type { FastifyInstance, FastifyRequest } from "fastify";

function profileRoutes(fastify: FastifyInstance): void {
    const profileController = fastify.diContainer.cradle.profileController;

    fastify.patch(
        "/me/avatar",
        {
            onRequest: [fastify.authenticate],
            config: {
                rateLimit: RateLimitPolicies.STRICT,
            },
            schema: {
                tags: ["Profile"],
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
            schema: {
                tags: ["Profile"],
            },
        },
        profileController.uploadBannerMe.bind(profileController),
    );

    fastify.patch<{ Body: UpdateProfileBody }>(
        "/me",
        {
            schema: {
                body: UpdateProfileBodySchema,
                tags: ["Profile"],
            },
            onRequest: [fastify.authenticate],
        },
        profileController.updateProfileMe.bind(profileController),
    );

    fastify.get<{ Querystring: SearchProfilesQuery }>(
        "/search",
        {
            schema: {
                querystring: SearchProfilesQuerySchema,
                tags: ["Profile"],
            },
            onRequest: async (request) => {
                if (request.headers.authorization) {
                    await request.jwtVerify();
                }
            },
        },
        profileController.searchProfiles.bind(profileController),
    );

    fastify.get<{ Params: GetProfileParams }>(
        "/:username",
        {
            schema: {
                params: GetProfileParamsSchema,
                tags: ["Profile"],
            },
            onRequest: async (request: FastifyRequest) => {
                if (request.headers.authorization) {
                    await request.jwtVerify();
                }
            },
        },
        profileController.getProfile.bind(profileController),
    );

    fastify.get(
        "/:username/followers",
        {
            schema: {
                params: FollowersParamsSchema,
                querystring: PaginationQuerySchema,
                tags: ["Profile"],
            },
        },
        profileController.getFollowers.bind(profileController),
    );

    fastify.get(
        "/:username/following",
        {
            schema: {
                params: FollowersParamsSchema,
                querystring: PaginationQuerySchema,
                tags: ["Profile"],
            },
        },
        profileController.getFollowing.bind(profileController),
    );
}

export default profileRoutes;
