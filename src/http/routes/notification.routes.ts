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
        },
        notificationController.getNotifications.bind(notificationController),
    );

    fastify.patch(
        "/read-all",
        { onRequest: [fastify.authenticate] },
        notificationController.markAllAsRead.bind(notificationController),
    );
}
