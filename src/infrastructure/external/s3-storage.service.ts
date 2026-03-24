import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { StoragePort } from "@core/ports/services/storage.port";
import type { FastifyInstance } from "fastify";

export class S3StorageService implements StoragePort {
    private readonly client: S3Client;
    private readonly bucketName: string;

    constructor(private readonly config: FastifyInstance["config"]) {
        this.bucketName = config.R2_BUCKET_NAME;

        this.client = new S3Client({
            region: "auto",
            endpoint: config.R2_ENDPOINT,
            credentials: {
                accessKeyId: config.R2_ACCESS_KEY_ID,
                secretAccessKey: config.R2_SECRET_ACCESS_KEY,
            },
        });
    }

    async upload(
        fileName: string,
        fileBuffer: Buffer,
        mimeType: string,
    ): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimeType,
        });

        await this.client.send(command);

        return fileName;
    }

    async delete(fileName: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
        });

        await this.client.send(command);
    }
}
