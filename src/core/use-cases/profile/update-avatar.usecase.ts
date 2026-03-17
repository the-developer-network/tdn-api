import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import type { UpdateAvatarInput } from "./update-avatar-usecase.input";
import type { StoragePort } from "@core/ports/services/storage.port";
import type { LoggerPort } from "@core/ports/services/logger.port";
import { InvalidFileTypeError } from "@core/errors/invalid-file-type.error";

export class UpdateAvatarUseCase {
    constructor(
        private readonly profileRepository: IProfileRepository,
        private readonly storageService: StoragePort,
        private readonly logger: LoggerPort,
    ) {}

    async execute(input: UpdateAvatarInput): Promise<string> {
        if (!input.mimeType.startsWith("image/")) {
            throw new InvalidFileTypeError(
                "Invalid file type. Only images are allowed.",
            );
        }
        const oldAvatarUrl = await this.profileRepository.findAvatarByUserId(
            input.userId,
        );

        const extension = input.originalFileName.split(".").pop() || "jpeg";
        const newFileName = `avatars/${input.userId}-${Date.now()}.${extension}`;

        const uploadedFilePath = await this.storageService.upload(
            newFileName,
            input.fileBuffer,
            input.mimeType,
        );

        await this.profileRepository.updateAvatar(
            input.userId,
            uploadedFilePath,
        );

        if (oldAvatarUrl) {
            try {
                await this.storageService.delete(oldAvatarUrl);
            } catch (error) {
                this.logger?.error(
                    {
                        err: error,
                        userId: input.userId,
                        targetUrl: oldAvatarUrl,
                        op: "delete_old_avatar",
                    },
                    "failed to delete old avatar from storage",
                );
            }
        }

        return uploadedFilePath;
    }
}
