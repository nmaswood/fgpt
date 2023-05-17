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
  const url = `${SERVER_SETTINGS.publicApiEndpoint}/api/${proxy}`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    ...req.headers,
  } as any;

  delete headers["transfer-encoding"];

  try {
    const response = await fetch(
      url,

      {
        method,
        headers,
        ...(req.body ? { body: JSON.stringify(req.body) } : {}),
      }
    );
    res.status(response.status).json(await response.json());
  } catch (e) {
    console.error(e);
  }
}

export default withApiAuthRequired(proxy);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};
