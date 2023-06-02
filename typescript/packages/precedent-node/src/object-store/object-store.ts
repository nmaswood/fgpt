import { Storage } from "@google-cloud/storage";

export interface BlobStorageService {
  upload(bucketName: string, fileName: string, data: Buffer): Promise<void>;
  download(bucketName: string, fileName: string): Promise<Buffer>;
  listFiles(bucketName: string, prefix: string): Promise<CloudFile[]>;
  getSignedUrl(bucketName: string, fileName: string): Promise<string>;
}

export interface CloudFile {
  name: string;
  download: () => Promise<Buffer>;
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

  async listFiles(bucketName: string, prefix: string): Promise<CloudFile[]> {
    const bucket = this.#storage.bucket(bucketName);

    const [files] = await bucket.getFiles({ prefix });
    return files.map((f) => ({
      name: f.name,
      download: async () => {
        const [buffer] = await f.download();
        return buffer;
      },
    }));
  }

  async getSignedUrl(bucketName: string, fileName: string): Promise<string> {
    const bucket = this.#storage.bucket(bucketName);
    const [url] = await bucket.file(fileName).getSignedUrl({
      version: "v4",
      action: "read",
      expires: getTruncatedTime(),
    });

    return url;
  }
}

const getTruncatedTime = () => {
  const currentTime = new Date();
  const d = new Date(currentTime);

  d.setMinutes(Math.floor(d.getMinutes() / 10) * 10);
  d.setSeconds(0);
  d.setMilliseconds(0);

  return new Date(d.getTime() + 60_000 * 30);
};
