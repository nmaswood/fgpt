import { getAccessToken, withApiAuthRequired } from "@auth0/nextjs-auth0";
import type { NextApiRequest, NextApiResponse } from "next";

async function proxy(req: NextApiRequest, res: NextApiResponse) {
  const { accessToken } = await getAccessToken(req, res);

  try {
    res.json({ accessToken });
    res.status(200).end();
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error });
  }
}

export default withApiAuthRequired(proxy);
