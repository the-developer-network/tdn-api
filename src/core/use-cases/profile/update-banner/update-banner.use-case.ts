import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import type { UpdateBannerUseCaseInput } from "./update-banner-usecase.input";
import { InvalidFileTypeError } from "@core/errors/invalid-file-type.error";
import type { StoragePort } from "@core/ports/services/storage.port";
import type { LoggerPort } from "@core/ports/services/logger.port";

export class UpdateBannerUseCase {
    constructor(
        private readonly profileRepository: IProfileRepository,
        private readonly storageService: StoragePort,
        private readonly logger: LoggerPort,
    ) {}

    async execute(input: UpdateBannerUseCaseInput): Promise<string> {
        if (!input.mimeType.startsWith("image/")) {
            throw new InvalidFileTypeError(
                "Invalid file type. Only images are allowed.",
            );
        }

        const oldBannerUrl = await this.profileRepository.findBannerByUserId(
            input.userId,
        );

        const extension = input.originalFileName.split(".").pop() || "jpeg";
        const newFileName = `banners/${input.userId}-${Date.now()}.${extension}`;

        const uploadedFilePath = await this.storageService.upload(
            newFileName,
            input.fileBuffer,
            input.mimeType,
        );

        await this.profileRepository.updateBanner(
            input.userId,
            uploadedFilePath,
        );

        if (oldBannerUrl) {
            try {
                await this.storageService.delete(oldBannerUrl);
            } catch (error) {
                this.logger.error(
                    {
                        err: error,
                        userId: input.userId,
                        targetUrl: oldBannerUrl,
                        op: "delete_old_banner",
                    },
                    "failed to delete old banner from storage",
                );
            }
        }

        return uploadedFilePath;
    }
}
