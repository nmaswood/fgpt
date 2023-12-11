import type { NextApiRequest, NextApiResponse } from "next";

import { SERVER_SETTINGS } from "../../src/settings";

export default async function proxy(_: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(`${SERVER_SETTINGS.publicApiEndpoint}/ping`);
    res.status(response.status).json(await response.json());
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error });
  }
}
