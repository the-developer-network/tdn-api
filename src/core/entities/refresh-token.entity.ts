export interface RefreshTokenProps {
    id: string;
    tokenHash: string;
    userId: string;
    deviceIp: string;
    userAgent: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class RefreshToken {
    constructor(private readonly props: RefreshTokenProps) {}

    get id(): string {
        return this.props.id;
    }
    get tokenHash(): string {
        return this.props.tokenHash;
    }
    get userId(): string {
        return this.props.userId;
    }
    get deviceIp(): string {
        return this.props.deviceIp;
    }
    get userAgent(): string {
        return this.props.userAgent;
    }
    get expiresAt(): Date {
        return this.props.expiresAt;
    }
    get isRevoked(): boolean {
        return this.props.isRevoked;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    public isExpired(): boolean {
        return new Date() > this.props.expiresAt;
    }

    public isValid(): boolean {
        return !this.props.isRevoked && !this.isExpired();
    }

    public revoke(): void {
        this.props.isRevoked = true;
        this.props.updatedAt = new Date();
    }
}
