export interface StoragePort {
    upload(
        fileName: string,
        fileBuffer: Buffer,
        mimeType: string,
    ): Promise<string>;
    delete(fileName: string): Promise<void>;
}
