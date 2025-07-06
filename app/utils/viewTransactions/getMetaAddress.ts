import { REGISTRY_ADDRESS } from "../../constants/contracts";
import REGISTRY_ABI from "../../constants/abi/registryAbi.json";
import { useReadContract } from "wagmi";

export const useReadMetaAddress = ({ address }: { address: string }) => {
  return useReadContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      args: [address, BigInt(1)],
      functionName: "stealthMetaAddressOf",
      query: {
        enabled: !!address,
        staleTime: Infinity,
      }
  })
};
