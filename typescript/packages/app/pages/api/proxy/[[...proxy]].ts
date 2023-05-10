import type { NextApiRequest, NextApiResponse } from "next";

import { SETTINGS } from "../../../src/settings";

export default async function proxy(req: NextApiRequest, res: NextApiResponse) {
  const proxy = (() => {
    const path = req.query.proxy ?? [];
    const asArray = Array.isArray(path) ? path : [path];
    return asArray.join("/");
  })();

  const method = req.method ?? "GET";
  const url = `${SETTINGS.publicApiEndpoint}/api/v1/${proxy}`;
  console.log({ method, url });
  try {
    const response = await fetch(
      url,

      {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        ...(req.body ? { body: JSON.stringify(req.body) } : {}),
      }
    );
    res.status(response.status).json(await response.json());
  } catch (e) {
    console.error(e);
    console.log("WTF happened?");
  }
}
