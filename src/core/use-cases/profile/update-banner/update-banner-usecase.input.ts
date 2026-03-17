export interface UpdateBannerUseCaseInput {
    userId: string;
    mimeType: string;
    originalFileName: string;
    fileBuffer: Buffer;
}
