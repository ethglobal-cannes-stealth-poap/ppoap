import { REGISTRY_ADDRESS } from "../../constants/contracts";
import REGISTRY_ABI from "../../constants/abi/registryAbi.json";
import { getPublicClient } from "wagmi/actions";
import { CHAIN_ID, configFront } from "../../lib/wallet";

export const getMetaAddress = async ({ address }: { address: string }) => {
  try {
    const client = getPublicClient(configFront, { chainId: CHAIN_ID });
    if (!client) throw new Error("Error retrieving public client");

    const result = await client.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      args: [address, BigInt(1)],
      functionName: "stealthMetaAddressOf",
    });

    return result && result !== "0x";
  } catch (e) {
    console.error(e);
    return;
  }
};
