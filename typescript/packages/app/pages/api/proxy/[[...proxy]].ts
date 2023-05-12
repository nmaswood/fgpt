import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import type { NextApiRequest, NextApiResponse } from "next";

import { SERVER_SETTINGS } from "../../../src/settings";

async function proxy(req: NextApiRequest, res: NextApiResponse) {
  const proxy = (() => {
    const path = req.query.proxy ?? [];
    const asArray = Array.isArray(path) ? path : [path];
    return asArray.join("/");
  })();

  const { accessToken } = await getAccessToken(req, res);

  const method = req.method ?? "GET";
  const url = `${SERVER_SETTINGS.publicApiEndpoint}/${proxy}`;
  console.log({ method, url, accessToken });
  try {
    const response = await fetch(
      url,

      {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
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

export default withApiAuthRequired(proxy);
