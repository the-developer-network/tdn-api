import type { PurgeExpiredUsersUseCase } from "@core/use-cases/user/purge-expired-users/purge-expired-users.use-case";

export class UserPurgeJob {
    constructor(
        private readonly purgeExpiredUsersUseCase: PurgeExpiredUsersUseCase,
    ) {}

    async run(): Promise<number> {
        return this.purgeExpiredUsersUseCase.execute();
    }
}
