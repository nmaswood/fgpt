import { Storage } from "@google-cloud/storage";

export interface BlobStorageService {
  upload(bucketName: string, fileName: string, data: Buffer): Promise<void>;
  download(bucketName: string, fileName: string): Promise<Buffer>;
  getSignedUrls(bucketName: string, fileName: string): Promise<string[]>;
}

export class GoogleCloudStorageService implements BlobStorageService {
  #storage: Storage;

  constructor() {
    this.#storage = new Storage({
      retryOptions: {
        autoRetry: true,
        maxRetries: 4,
        retryDelayMultiplier: 3,
        totalTimeout: 100,
      },
    });
  }

  async upload(
    bucketName: string,
    fileName: string,
    data: Buffer
  ): Promise<void> {
    const bucket = this.#storage.bucket(bucketName);
    const blob = bucket.file(fileName);
    await blob.save(data);
  }

  async download(bucketName: string, fileName: string): Promise<Buffer> {
    const bucket = this.#storage.bucket(bucketName);
    const blob = bucket.file(fileName);
    const [data] = await blob.download();
    return data;
  }

  async getSignedUrls(_: string, __: string): Promise<string[]> {
    // https://cloud.google.com/storage/docs/samples/storage-generate-signed-url-v4
    // https://advancedweb.hu/cacheable-s3-signed-urls
    throw new Error("Method not implemented.");
  }
}
