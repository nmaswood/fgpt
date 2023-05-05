import { Bucket, Storage } from "@google-cloud/storage";

export interface BlobStorageService {
  upload(bucketName: string, fileName: string, data: Buffer): Promise<void>;
  download(bucketName: string, fileName: string): Promise<Buffer>;
}

export class GoogleCloudStorageService implements BlobStorageService {
  #storage: Storage;

  constructor() {
    this.#storage = new Storage();
  }

  async #getBucket(bucketName: string): Promise<Bucket> {
    const [bucket] = await this.#storage.createBucket(bucketName);
    return bucket;
  }

  async upload(
    bucketName: string,
    fileName: string,
    data: Buffer
  ): Promise<void> {
    const bucket = await this.#getBucket(bucketName);
    const blob = bucket.file(fileName);
    await blob.save(data);
  }

  async download(bucketName: string, fileName: string): Promise<Buffer> {
    const bucket = await this.#getBucket(bucketName);
    const blob = bucket.file(fileName);
    const [data] = await blob.download();
    return data;
  }
}
