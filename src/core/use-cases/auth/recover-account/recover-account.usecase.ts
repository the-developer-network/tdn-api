import type { IUserRepository } from "@core/ports/repositories/user.repository";
import type {
    AuthTokenPort,
    RecoveryPayload,
} from "@core/ports/services/auth-token.port";
import { UnauthorizedError, BadRequestError } from "@core/errors";
import { type LoginOutput } from "../login/login.output";
import type { RecoverAccountInput } from "./recover-account.input";

export class RecoverAccountUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly authTokenService: AuthTokenPort,
    ) {}

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
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
            refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
            user: {
                id: user.id,
                username: user.username,
            },
        };
    }
}
