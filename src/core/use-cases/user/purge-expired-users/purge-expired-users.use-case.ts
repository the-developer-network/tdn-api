import type { IUserRepository } from "@core/ports/repositories/user.repository";

export class PurgeExpiredUsersUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(): Promise<number> {
        return this.userRepository.deleteExpiredUser();
    }
}
