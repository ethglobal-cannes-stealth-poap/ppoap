import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export default async function POST(request: NextRequest) {
  try {
    const { poapId, address } = await request.json();

    if (!poapId || !address) {
      return NextResponse.json(
        { error: "Missing required fields: website and address" },
        { status: 400 }
      );
    }

    const response = await axios.post(
      "https://api.poap.tech/website/claim",
      {
        poapId,
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

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "POAP mint API error:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      {
        error: `Mint failed: ${error.response?.data?.message || error.message}`,
        status: error.response?.status || 500,
      },
      { status: error.response?.status || 500 }
    );
  }
}
