import crypto from "crypto";

export class ShaHash {
  static forData(b: Buffer | string): string {
    const hashSum = crypto.createHash("sha256");
    hashSum.update(b);
    return hashSum.digest("hex");
  }
}
