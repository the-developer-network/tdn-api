import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type {
    AuthTokenPort,
    RecoveryPayload,
} from "@core/ports/services/auth-token.port";
import { UnauthorizedError, BadRequestError } from "@core/errors";
import { type LoginOutput } from "../login/login.output";
import type { RecoverAccountInput } from "./recover-account.input";
import { AuthMapper } from "../auth.mapper";

/**
 * Use case for recovering a deleted user account.
 *
 * This use case handles the process of restoring a user account that was
 * previously soft-deleted, using a valid recovery token.
 */
export class RecoverAccountUseCase {
    /**
     * Creates a new instance of RecoverAccountUseCase.
     *
     * @param userRepository - Repository for managing user data
     * @param authTokenService - Service for token operations
     */
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly authTokenService: AuthTokenPort,
    ) {}

    /**
     * Executes the account recovery process.
     *
     * @param input - Recovery input containing the recovery token
     * @returns Promise<LoginOutput> Authentication tokens and user information
     *
     * @throws UnauthorizedError - When recovery token is invalid or expired
     * @throws BadRequestError - When user is not found
     *
     * @remarks
     * This method verifies the recovery token, restores the user account,
     * and generates new authentication tokens for the recovered account.
     */
    async execute(input: RecoverAccountInput): Promise<LoginOutput> {
        let payload: RecoveryPayload;

        try {
            payload = this.authTokenService.verifyRecoveryToken(
                input.recoveryToken,
            );
        } catch {
            throw new UnauthorizedError("Invalid or expired recovery token.");
        }

        if (payload.purpose !== "account_recovery") {
            throw new UnauthorizedError("Invalid token purpose.");
        }

        const userId = payload.sub;

        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new BadRequestError("User not found.");
        }

        await this.userRepository.restoreById(user.id);

        const tokens = this.authTokenService.generate({
            id: user.id,
            username: user.username,
        });

        return {
            user: {
                id: user.id,
                username: user.username,
                isEmailVerified: user.isEmailVerified,
            },
            tokens: AuthMapper.toTokenOutput({
                accessToken: tokens.accessToken,
                expiresAt: tokens.expiresAt,
                refreshToken: tokens.refreshToken,
                refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
            }),
        };
    }
}
