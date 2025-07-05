// import { CHAIN_ID } from "../../lib/wallet";
// import { REGISTRY_ADDRESS } from "../../constants/contracts";
// import REGISTRY_ABI from "@/constants/abi/registryAbi.json";
// import toast from "react-hot-toast";
// import {
//   getWalletClient,
//   getPublicClient,
//   waitForTransactionReceipt,
// } from "wagmi/actions";
// import { config } from "../../lib/wallet";

export const setMetaAddress = async ({ address }: { address: string }) => {
  // const toastId = toast.loading("Sign the transaction to stake...");
  // try {
  //   const walletClient = await getWalletClient(config, { chainId: CHAIN_ID });
  //   if (!walletClient) throw new Error("Error retrieving wallet client");
  //   const account = walletClient.account.address;
  //   const client = getPublicClient(config);
  //   if (!client) throw new Error("Error retrieving public client");
  //   const { request } = await client.simulateContract({
  //     account,
  //     address: REGISTRY_ADDRESS,
  //     abi: REGISTRY_ABI,
  //     args: [address, BigInt(1)],
  //     functionName: "registerKeys",
  //   });
  //   const hash = await walletClient.writeContract(request);
  //   const receipt = await waitForTransactionReceipt(config, { hash });
  //   toast.success("Successfully staked.", { id: toastId });
  //   return receipt;
  // } catch (e) {
  //   if (e.toString().includes("insufficient funds")) {
  //     toast.error("You dont have enough gas to execute this transaction.", {
  //       id: toastId,
  //     });
  //     throw e;
  //   }
  //   console.error(e);
  //   toast.error("Something went wrong", { id: toastId });
  //   throw e;
  // }
};
