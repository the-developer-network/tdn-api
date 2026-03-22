import type { StoragePort } from "@core/ports/services/storage.port";
import { InvalidMediaTypeError } from "@core/errors/invalid-media-type.error";

export interface UploadPostMediaInput {
    userId: string;
    fileBuffer: Buffer;
    mimeType: string;
    originalFileName: string;
}

export class UploadPostMediaUseCase {
    constructor(private readonly storageService: StoragePort) {}

    async execute(input: UploadPostMediaInput): Promise<string> {
        if (
            !input.mimeType.startsWith("image/") &&
            !input.mimeType.startsWith("video/")
        ) {
            throw new InvalidMediaTypeError();
        }

        const extension = input.originalFileName.split(".").pop() || "jpeg";
        const newFileName = `posts/${input.userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

        const uploadedFilePath = await this.storageService.upload(
            newFileName,
            input.fileBuffer,
            input.mimeType,
        );

        return uploadedFilePath;
    }
}
