import type { ChangePasswordUseCase } from "@core/use-cases/user/change-password/change-password-use.case";
import type { GetMeUserUseCase } from "@core/use-cases/user/get-me/get-me-user-.usecase";
import type SoftDeleteUserUseCase from "@core/use-cases/user/soft-delete/soft-delete-user.usecase";
import type { ChangePasswordBody } from "@typings/schemas/user/change-password.schema";
import type { SoftDeleteUserBody } from "@typings/schemas/user/solft-delete.schema";
import type { FastifyReply, FastifyRequest } from "fastify";

export default class UserController {
    constructor(
        private readonly softDeleteUserUseCase: SoftDeleteUserUseCase,
        private readonly getMeUserUseCase: GetMeUserUseCase,
        private readonly changePasswordUseCase: ChangePasswordUseCase,
    ) {}

    async softDelete(
        request: FastifyRequest<{ Body: SoftDeleteUserBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const id = request.user.id;
        const { password } = request.body;

        await this.softDeleteUserUseCase.execute({
            id,
            password,
        });

        reply.status(204).send();
    }

    async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const result = await this.getMeUserUseCase.execute({
            id: request.user.id,
        });

        reply.status(200).send(result);
    }

    async changePasswordMe(
        request: FastifyRequest<{ Body: ChangePasswordBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { currentPassword, newPassword } = request.body;

        await this.changePasswordUseCase.execute({
            id: request.user.id,
            currentPassword,
            newPassword,
        });

        reply.status(204).send();
    }
}
