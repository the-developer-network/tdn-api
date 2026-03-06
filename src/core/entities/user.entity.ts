export interface UserProps {
    id: string;
    email: string;
    username: string;
    passwordHash: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export class User {
    constructor(private readonly props: UserProps) {}

    get id(): string {
        return this.props.id;
    }

    get email(): string {
        return this.props.email;
    }

    get username(): string {
        return this.props.username;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get passwordHash(): string | null {
        return this.props.passwordHash;
    }
}
