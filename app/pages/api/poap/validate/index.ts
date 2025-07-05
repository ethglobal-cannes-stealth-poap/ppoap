import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

type Data = {
  data?: any;
  error?: any;
  status?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const { poapId } = req.query as {
      poapId: string;
    };

    if (!poapId) {
      console.log("Missing poapId parameter");
      return res.status(400).json({
        error: "Missing required parameter: poapId",
      });
    }

    const response = await axios.get(
      `https://collectors.poap.xyz/api/website/${poapId}/validate`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Cache-Control": "no-cache",
        },
        timeout: 15000,
      }
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error(
      "POAP validation API error:",
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 500).json({
      error: `Validation failed: ${
        error.response?.data?.message || error.message
      }`,
      status: error.response?.status || 500,
    });
  }
}
