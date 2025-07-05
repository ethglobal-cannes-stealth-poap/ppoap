import { REGISTRY_ADDRESS } from "../../constants/contracts";
import REGISTRY_ABI from "../../constants/abi/registryAbi.json";
import { ConnectedWallet } from "@privy-io/react-auth";
import {
  getPublicClient,
  getWalletClient,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { CHAIN_ID, configFront } from "../../lib/wallet";
import toast from "react-hot-toast";

export const setMetaAddress = async ({
  wallet,
  stealthMetaAddress,
}: {
  wallet: ConnectedWallet;
  stealthMetaAddress: string;
}) => {
  const toastId = toast.loading("Sign the transaction to stake...");
  const trimmedMetaAddress = stealthMetaAddress.replace("st:eth:", "");
  try {
    const walletClient = await getWalletClient(configFront, {
      chainId: CHAIN_ID,
    });
    const client = getPublicClient(configFront);

    if (!walletClient) throw new Error("Error retrieving public client");
    if (!client) throw new Error("Error retrieving client");

    const { request } = await client.simulateContract({
      account: wallet.address as `0x${string}`,
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      args: [BigInt(1), trimmedMetaAddress],
      functionName: "registerKeys",
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await waitForTransactionReceipt(configFront, { hash });
    toast.success("Successfully registered meta address.", { id: toastId });
    return receipt;
  } catch (e: any) {
    if (e.toString().includes("insufficient funds")) {
      toast.error("You dont have enough gas to execute this transaction.", {
        id: toastId,
      });
      throw e;
    }
    console.error(e);
    toast.error("Something went wrong", { id: toastId });
    throw e;
  }
};
