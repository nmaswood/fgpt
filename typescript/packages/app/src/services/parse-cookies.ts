import { X_IMPERSONATE_HEADER } from "@fgpt/precedent-iso";
import { z } from "zod";

export function parseCookies(
  cookies: Partial<{
    [key: string]: string;
  }>,
) {
  return ZCookies.parse(cookies);
}

const ZCookies = z.object({
  [X_IMPERSONATE_HEADER]: z.string().optional(),
});
