import type SoftDeleteUserUseCase from "@core/use-cases/user/soft-delete-user.usecase";
import type { SoftDeleteUserUseCaseInput } from "@core/use-cases/user/soft-delete-user.usecase";

export default class UserService {
    constructor(
        private readonly softDeleteUserUseCase: SoftDeleteUserUseCase,
    ) {}

    async softDeleteUser(input: SoftDeleteUserUseCaseInput): Promise<void> {
        await this.softDeleteUserUseCase.execute(input);
    }
}
