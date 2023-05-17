import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import type { NextApiRequest, NextApiResponse } from "next";

import { SERVER_SETTINGS } from "../../src/settings";

async function proxy(req: NextApiRequest, res: NextApiResponse) {
  const { accessToken } = await getAccessToken(req, res);

  const contentType = req.headers["content-type"];
  try {
    const response = await fetch(
      `${SERVER_SETTINGS.publicApiEndpoint}/api/v1/files/upload`,

      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(contentType && { "content-type": contentType }),
        },
        body: req.body,
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
