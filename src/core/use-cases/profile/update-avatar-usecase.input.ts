export interface UpdateAvatarInput {
    userId: string;
    fileBuffer: Buffer;
    mimeType: string;
    originalFileName: string;
}
