import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import type { NextApiRequest, NextApiResponse } from "next";
import httpProxyMiddleware from "next-http-proxy-middleware";

import { SERVER_SETTINGS } from "../../src/settings";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "100mb",
  },
};

async function proxy(req: NextApiRequest, res: NextApiResponse) {
  const { accessToken } = await getAccessToken(req, res);
  const target = `${SERVER_SETTINGS.publicApiEndpoint}/api/v1/files/upload`;

  const value = httpProxyMiddleware(req, res, {
    target,
    ignorePath: true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return value;
}

export default withApiAuthRequired(proxy);
