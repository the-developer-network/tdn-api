export interface PasswordPort {
    hash(plain: string): Promise<string>;
    verify(plain: string, hash: string): Promise<boolean>;
}
