import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ens = searchParams.get("ens");

    if (!ens) {
      return NextResponse.json(
        { error: "Missing required parameter: ens" },
        { status: 400 }
      );
    }

    const response = await axios.get(
      `https://profiles.poap.tech/profile/${ens}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(
      "POAP profile API error:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      {
        error: `Profile lookup failed: ${
          error.response?.data?.message || error.message
        }`,
        status: error.response?.status || 500,
      },
      { status: error.response?.status || 500 }
    );
  }
}
