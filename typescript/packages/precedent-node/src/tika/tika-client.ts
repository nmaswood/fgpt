import axios, { AxiosInstance } from "axios";
import * as FS from "fs/promises";
import { GoogleAuth } from "google-auth-library";

export interface TikaClient {
  detectFromFilename(fileName: string): Promise<string>;
  extractFromFile(fileName: string): Promise<string>;
  extract(fileName: string, data: Buffer): Promise<string>;
}

export class TikaHttpClient implements TikaClient {
  #client: AxiosInstance;
  #origin: string;

  constructor(private readonly baseURL: string) {
    const url = new URL(baseURL);
    this.#origin = url.origin;

    this.#client = axios.create({
      baseURL,
      // 15 minutes
      timeout: 15 * 60 * 1000,
    });
  }

  async init() {
    const token = await this.#getToken();
    if (token) {
      this.#client.defaults.headers.common["Authorization"] = token;
    }
  }

  async #getToken(): Promise<string | undefined> {
    const auth = new GoogleAuth();
    if (this.#origin.startsWith("http://localhost")) {
      return undefined;
    }
    console.log({ origin: this.#origin, baseURL: this.baseURL });
    const client = await auth.getIdTokenClient(this.#origin);
    const headers = await client.getRequestHeaders();
    const token = headers.Authorization;
    console.log({ token });

    return token;
  }

  async detectFromFilename(filename: string): Promise<string> {
    const token = await this.#getToken();
    console.log({ token });

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
    const token = await this.#getToken();
    console.log({ token });
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
