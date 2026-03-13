import { type SoftDeleteUserUseCaseInput } from "@core/use-cases/user/soft-delete/soft-delete-user-usecase.input";
import type SoftDeleteUserUseCase from "@core/use-cases/user/soft-delete/soft-delete-user.usecase";
import type { FastifyReply, FastifyRequest } from "fastify";

export default class UserController {
    constructor(
        private readonly softDeleteUserUseCase: SoftDeleteUserUseCase,
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

        reply.status(200).send();
    }
}
