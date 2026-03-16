import type { GetMeUserUseCase } from "@core/use-cases/user/get-me/get-me-user-.usecase";
import { type SoftDeleteUserUseCaseInput } from "@core/use-cases/user/soft-delete/soft-delete-user-usecase.input";
import type SoftDeleteUserUseCase from "@core/use-cases/user/soft-delete/soft-delete-user.usecase";
import type { FastifyReply, FastifyRequest } from "fastify";

export default class UserController {
    constructor(
        private readonly softDeleteUserUseCase: SoftDeleteUserUseCase,
        private readonly getMeUserUseCase: GetMeUserUseCase,
    ) {}

    async softDelete(
        request: FastifyRequest<{ Body: SoftDeleteUserUseCaseInput }>,
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
}
