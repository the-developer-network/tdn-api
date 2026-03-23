export interface UploadPostMediaInput {
    userId: string;
    fileBuffer: Buffer;
    mimeType: string;
    originalFileName: string;
}
