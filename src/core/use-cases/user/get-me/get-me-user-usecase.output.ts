export interface GetMeUserUseCaseOutput {
    username: string;
    email: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    providers: string[];
}
