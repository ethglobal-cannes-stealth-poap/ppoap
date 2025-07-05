import { getPublicClient } from "wagmi/actions";
import { config } from "../../lib/wallet";
import { REGISTRY_ADDRESS } from "../../constants/contracts";
import REGISTRY_ABI from "../../constants/abi/registryAbi.json";
import { CHAIN_ID } from "../../lib/wallet";

export const getMetaAddress = async ({ address }) => {
  try {
    const client = getPublicClient(config, { chainId: CHAIN_ID });
    console.log("client", client);
    if (!client) throw new Error("Error retrieving public client");
    console.log({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      args: [address, BigInt(1)],
      functionName: "stealthMetaAddressOf"
    });
    const result = await client.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      args: [address, BigInt(1)],
      functionName: "stealthMetaAddressOf"
    });
    console.log("result", result);
    return result;
  } catch (e) {
    console.error(e);
    return;
  }
};