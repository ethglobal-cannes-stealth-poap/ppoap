import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Data = {
  data?: any;
  error?: any;
  status?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { poapId, address } = req.body;

    if (!poapId || !address) {
      return res.status(400).json({
        error: "Missing required fields: poapId and address",
      });
    }

    const response = await axios.post(
      "https://api.poap.tech/website/claim",
      {
        website: poapId,
        address,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-API-Key": process.env.POAP_API_KEY || "",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error(
      "POAP mint API error:",
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 500).json({
      error: `Mint failed: ${error.response?.data?.message || error.message}`,
      status: error.response?.status || 500,
    });
  }
}
