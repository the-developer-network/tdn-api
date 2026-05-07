import { beforeEach, describe, expect, it, vi } from "vitest";
import { UploadPostMediaUseCase } from "@core/use-cases/post/upload-post-media";
import type { StoragePort } from "@core/ports/services/storage.port";
import { InvalidMediaTypeError } from "@core/errors";

describe("UploadPostMediaUseCase", () => {
    let useCase: UploadPostMediaUseCase;
    let storageService: Pick<StoragePort, "upload">;

    beforeEach(() => {
        storageService = {
            upload: vi
                .fn()
                .mockResolvedValue(
                    "https://cdn.example.com/posts/user-1/file.jpg",
                ),
        };
        useCase = new UploadPostMediaUseCase(storageService as StoragePort);
    });

    it("should throw InvalidMediaTypeError for non-image/video MIME type", async () => {
        await expect(
            useCase.execute({
                userId: "user-1",
                fileBuffer: Buffer.from("data"),
                mimeType: "application/pdf",
                originalFileName: "document.pdf",
            }),
        ).rejects.toThrow(InvalidMediaTypeError);

        expect(storageService.upload).not.toHaveBeenCalled();
    });

    it("should upload image and return URL", async () => {
        vi.mocked(storageService.upload).mockResolvedValue(
            "https://cdn.example.com/posts/user-1/photo.png",
        );

        const result = await useCase.execute({
            userId: "user-1",
            fileBuffer: Buffer.from("img"),
            mimeType: "image/png",
            originalFileName: "photo.png",
        });

        expect(result).toBe("https://cdn.example.com/posts/user-1/photo.png");
        expect(storageService.upload).toHaveBeenCalledOnce();
    });

    it("should upload video and return URL", async () => {
        vi.mocked(storageService.upload).mockResolvedValue(
            "https://cdn.example.com/posts/user-1/clip.mp4",
        );

        const result = await useCase.execute({
            userId: "user-1",
            fileBuffer: Buffer.from("vid"),
            mimeType: "video/mp4",
            originalFileName: "clip.mp4",
        });

        expect(result).toBe("https://cdn.example.com/posts/user-1/clip.mp4");
        expect(storageService.upload).toHaveBeenCalledOnce();
    });

    it("should generate filename with posts/{userId}/ prefix", async () => {
        await useCase.execute({
            userId: "user-42",
            fileBuffer: Buffer.from("img"),
            mimeType: "image/jpeg",
            originalFileName: "avatar.jpg",
        });

        const [passedFileName] = vi.mocked(storageService.upload).mock.calls[0];
        expect(passedFileName).toMatch(/^posts\/user-42\/.+\.jpg$/);
    });
});
