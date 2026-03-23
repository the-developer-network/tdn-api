import type { ChangeEmailUseCase } from "@core/use-cases/user/change-email";
import type { ChangePasswordUseCase } from "@core/use-cases/user/change-password";
import type { ChangeUsernameUseCase } from "@core/use-cases/user/change-username";
import type { GetMeUserUseCase } from "@core/use-cases/user/get-me";
import type { SoftDeleteUserUseCase } from "@core/use-cases/user/soft-delete";
import type { ChangeEmailBody } from "@typings/schemas/user/change-email.schema";
import type { ChangePasswordBody } from "@typings/schemas/user/change-password.schema";
import type { ChangeUsernameBody } from "@typings/schemas/user/change-username.schema";
import type { SoftDeleteUserBody } from "@typings/schemas/user/solft-delete.schema";
import type { FastifyReply, FastifyRequest } from "fastify";

export default class UserController {
    constructor(
        private readonly softDeleteUserUseCase: SoftDeleteUserUseCase,
        private readonly getMeUserUseCase: GetMeUserUseCase,
        private readonly changePasswordUseCase: ChangePasswordUseCase,
        private readonly changeUsernameUseCase: ChangeUsernameUseCase,
        private readonly changeEmailUseCase: ChangeEmailUseCase,
    ) {}

    async softDeleteMe(
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

    async changeUsernameMe(
        request: FastifyRequest<{ Body: ChangeUsernameBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;

        await this.changeUsernameUseCase.execute({
            id: userId,
            newUsername: request.body.newUsername,
        });

        return reply.status(204).send();
    }

    async changeEmailMe(
        request: FastifyRequest<{ Body: ChangeEmailBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;

        await this.changeEmailUseCase.execute({
            id: userId,
            newEmail: request.body.newEmail,
        });

        return reply.status(204).send();
    }
}
