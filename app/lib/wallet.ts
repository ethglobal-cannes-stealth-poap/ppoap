import { createConfig } from "@privy-io/wagmi";
import { sepolia } from "wagmi/chains";
import { Abi, http } from "viem";
import { createPublicClient, createWalletClient, custom } from "viem";
import { ConnectedWallet } from "@privy-io/react-auth";

const ALCHEMY_RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;
if (!ALCHEMY_RPC_URL) {
  throw new Error(
    "NEXT_PUBLIC_ALCHEMY_RPC_URL is not defined. Please set it in your .env file."
  );
}

export const CHAIN_ID = sepolia.id;

export const configFront = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(ALCHEMY_RPC_URL),
  },
});

export const getViemClient = () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
    batch: {
      multicall: !!sepolia.contracts?.multicall3?.address,
    },
  });

  return client;
};

export const getWalletClient = async (wallet: ConnectedWallet) => {
  if (!wallet) {
    throw new Error("Wallet is not connected");
  }
  const provider = await wallet.getEthereumProvider();
  const client = createWalletClient({
    account: wallet.address as `0x${string}`,
    chain: sepolia,
    transport: custom(provider),
  });

  return client;
};

export const fetchEventsViem = async ({
  client,
  address,
  event,
  args,
}: {
  client: any;
  address: string;
  event: string;
  args?: any[];
}) => {
  try {
    return await client.getLogs({
      address,
      event,
      args: args,
    });
  } catch (error) {
    console.error("Onchain event fetch failed", error);
    throw error;
  }
};

export const getEvent = (abi: Abi, eventName: string) => {
  return abi.find((item) => {
    return item.type === "event" && item?.name === eventName;
  });
};
