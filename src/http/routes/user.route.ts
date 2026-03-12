import {
    type SoftDeleteUserBody,
    SoftDeleteUserSchema,
} from "@typings/schemas/user.schame";
import type { FastifyInstance } from "fastify";

function userRoute(fastify: FastifyInstance): void {
    const userService = fastify.diContainer.cradle.userService;

    fastify.delete<{ Body: SoftDeleteUserBody }>(
        "/me",
        {
            onRequest: [fastify.authenticate],
            schema: {
                body: SoftDeleteUserSchema,
            },
        },
        async (request, reply) => {
            const id = request.user.id;
            const { password } = request.body;

            await userService.softDeleteUser({
                id,
                password,
            });

            reply.status(200).send();
        },
    );
}

export default userRoute;
