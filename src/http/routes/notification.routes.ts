import { RateLimitPolicies } from "@plugins/rate-limit.plugin";
import {
    GetNotificationsQuerySchema,
    type GetNotificationsQuery,
} from "@typings/schemas/notification/get-notification.schema";
import type { FastifyInstance } from "fastify";

export default function notificationRoutes(fastify: FastifyInstance): void {
    const notificationController =
        fastify.diContainer.cradle.notificationController;

    fastify.get<{ Querystring: GetNotificationsQuery }>(
        "/",
        {
            onRequest: [fastify.authenticate],
            schema: {
                querystring: GetNotificationsQuerySchema,
            },
            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        notificationController.getNotifications.bind(notificationController),
    );

    fastify.patch(
        "/read-all",
        {
            onRequest: [fastify.authenticate],
            config: { rateLimit: RateLimitPolicies.STANDARD },
        },
        notificationController.markAllAsRead.bind(notificationController),
    );
}
