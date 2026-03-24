import { UnauthorizedError } from "@core/errors";
import type { IOAuthAccountRepository } from "@core/ports/repositories/oauth-account.repository";
import type { IUserRepository } from "@core/ports/repositories/user.repository";
import { UserPrismaMapper } from "@infrastructure/persistence/mappers/user-prisma.mapper";
import type { GetMeUserUseCaseInput } from "./get-me-user-usecase.input";
import type { GetMeUserUseCaseOutput } from "./get-me-user-usecase.output";

/**
 * Use case for retrieving the current authenticated user's information.
 *
 * This use case handles fetching the user's profile data along with their
 * connected OAuth providers for the currently authenticated session.
 */
export class GetMeUserUseCase {
    /**
     * Creates a new instance of GetMeUserUseCase.
     *
     * @param userRepository - Repository for managing user data
     * @param oauthAccountRepository - Repository for managing OAuth account data
     */
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly oauthAccountRepository: IOAuthAccountRepository,
    ) {}

    /**
     * Executes the get current user process.
     *
     * @param input - Input containing the user ID
     * @returns Promise<GetMeUserUseCaseOutput> User data with OAuth providers
     *
     * @throws UnauthorizedError - When the user is not found or session is invalid
     *
     * @remarks
     * This method retrieves the user by ID, validates their existence,
     * fetches their connected OAuth providers, and returns sanitized user data
     * excluding sensitive information like passwords.
     */
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
