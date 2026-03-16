export interface IOAuthAccountRepository {
    /**
     *
     * @param userId User Id
     * @returns ["github", "google"]
     */
    findProvidersByUserId(userId: string): Promise<string[]>;
}
