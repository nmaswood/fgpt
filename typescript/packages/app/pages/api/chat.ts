import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import type { NextApiRequest, NextApiResponse } from "next";
import httpProxyMiddleware from "next-http-proxy-middleware";

import { SERVER_SETTINGS } from "../../src/settings";

async function proxy(req: NextApiRequest, res: NextApiResponse) {
  const { accessToken } = await getAccessToken(req, res);
  const body = JSON.parse(req.body);
  const params = new URLSearchParams(body);
  const target = `${SERVER_SETTINGS.publicApiEndpoint}/api/v1/chat/chat?${params}`;

  const value = httpProxyMiddleware(req, res, {
    target,
    ignorePath: true,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    ws: true,
  });
  return value;
}

export default withApiAuthRequired(proxy);
