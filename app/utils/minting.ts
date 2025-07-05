import axios from "axios";

export const performMint = async (poapId: string, address: string) => {
  try {
    const response = await axios.post(
      "/api/poap/mint",
      {
        poapId: poapId,
        address: address,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err: any) {
    console.log("Mint API error:", err.response?.data || err.message);
    throw new Error(
      `Mint failed (${err.response?.status || "Network Error"}): ${
        err.response?.data?.error || err.message
      }`
    );
  }
};
