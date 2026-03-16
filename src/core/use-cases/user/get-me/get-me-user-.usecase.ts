import { UnauthorizedError } from "@core/errors";
import type { IOAuthAccountRepository } from "@core/ports/repositories/oauth-account.repository";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import UserPrismaMapper from "@infrastructure/mappers/user-prisma.mapper";
import type { GetMeUserUseCaseInput } from "./get-me-user-usecase.input";
import type { GetMeUserUseCaseOutput } from "./get-me-user-usecase.output";

export class GetMeUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly oauthAccountRepository: IOAuthAccountRepository,
    ) {}

    async execute(
        input: GetMeUserUseCaseInput,
    ): Promise<GetMeUserUseCaseOutput> {
        const { id } = input;
        const user = await this.userRepository.findById(id);

        if (!user) throw new UnauthorizedError("Invalid or expired session.");

        const providers =
            await this.oauthAccountRepository.findProvidersByUserId(id);

        const safeUser = UserPrismaMapper.toResponse(user);

        return {
            ...safeUser,
            providers,
        };
    }
}
