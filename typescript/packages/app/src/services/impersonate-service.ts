import { X_IMPERSONATE_HEADER } from "@fgpt/precedent-iso";
import { getCookie, removeCookie, setCookie } from "typescript-cookie";

const IS_BROWSER = isBrowser();

export class ImpersonateService {
  static get() {
    if (!IS_BROWSER) {
      return undefined;
    }
    return getCookie(X_IMPERSONATE_HEADER);
  }
  static set(id: string) {
    if (!IS_BROWSER) {
      throw new Error("cannot set cookie on server");
    }
    setCookie(X_IMPERSONATE_HEADER, id, { expires: 1 });
  }
  static clear() {
    if (!IS_BROWSER) {
      throw new Error("cannot clear cookie on server");
    }
    removeCookie(X_IMPERSONATE_HEADER);
  }
}
function isBrowser() {
  return typeof document !== "undefined";
}
