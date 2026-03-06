import { InvalidCredentialsError } from "@core/errors/invalid-credentials.error";
import type { UserPayload } from "@core/interfaces/user-payload.interface";
import type { PasswordPort } from "@core/ports/password.port";
import type { TokenPort } from "@core/ports/token.port";
import type { IUserRepository } from "@core/repositories/user.repository";

interface LoginInput {
    identifier: string;
    password: string;
}

interface LoginOutput {
    accessToken: string;
    expiresAt: number;
    user: UserPayload;
}

export class LoginUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordService: PasswordPort,
        private readonly tokenService: TokenPort,
    ) {}

    async execute(input: LoginInput): Promise<LoginOutput> {
        const user = await this.userRepository.findByIdentifier(
            input.identifier,
        );

        if (!user || !user.passwordHash) {
            throw new InvalidCredentialsError();
        }

        const isPasswordValid = await this.passwordService.verify(
            input.password,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }

        const payload: UserPayload = {
            id: user.id,
            username: user.username,
        };

        const { accessToken, expiresAt } = this.tokenService.generate(payload);

        return {
            accessToken,
            expiresAt,
            user: payload,
        };
    }
}
