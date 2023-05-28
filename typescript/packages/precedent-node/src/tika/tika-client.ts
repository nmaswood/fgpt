import axios, { AxiosInstance } from "axios";
import * as FS from "fs/promises";

export interface TikaClient {
  detectFromFilename(fileName: string): Promise<string>;
  extractFromFile(fileName: string): Promise<string>;
  extract(fileName: string, data: Buffer): Promise<string>;
}

export class TikaHttpClient implements TikaClient {
  #client: AxiosInstance;

  constructor(baseURL: string) {
    console.log("baseURL", baseURL);
    console.log("Hello world");
    this.#client = axios.create({
      baseURL,
    });
  }

  async detectFromFilename(filename: string): Promise<string> {
    const response = await this.#client({
      method: "PUT",
      url: "/detect/stream",
      headers: {
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
    const mimeType = response.data;
    if (typeof mimeType !== "string") {
      throw new Error("invalid result");
    }

    return mimeType;
  }

  async extractFromFile(fileName: string): Promise<string> {
    const data = await FS.readFile(fileName);
    return this.extract(fileName, data);
  }

  async extract(filename: string, data: Buffer): Promise<string> {
    const mimeType =
      "application/pdf" ?? (await this.detectFromFilename(filename));

    const response = await this.#client({
      method: "PUT",
      url: "/tika",
      data,
      headers: {
        "Content-type": mimeType,
      },
    });
    const extractData = response.data;

    return extractData["X-TIKA:content"];
  }
}
