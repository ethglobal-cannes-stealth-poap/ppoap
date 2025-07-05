import { createConfig } from "@privy-io/wagmi";
import { base, gnosis, mainnet, sepolia } from "wagmi/chains";
import { Abi, http } from "viem";
import { createPublicClient, createWalletClient, custom } from "viem";
import { ConnectedWallet } from "@privy-io/react-auth";

const ALCHEMY_RPC_KEY = process.env.NEXT_PUBLIC_ALCHEMY_RPC_KEY;
if (!ALCHEMY_RPC_KEY) {
  throw new Error(
    "NEXT_PUBLIC_ALCHEMY_RPC_KEY is not defined. Please set it in your .env file."
  );
}

export const CHAIN_ID = 11155111;

const alchemyMappings = {
  [sepolia.id]: "eth-sepolia",
  [mainnet.id]: "eth-mainnet",
  [gnosis.id]: "gnosis",
  [base.id]: "base",
}

const getAlchemyRpcUrl = (chainId: number) => {
  const chain = alchemyMappings[chainId as keyof typeof alchemyMappings];
  if (!chain) {
    throw new Error(`No Alchemy RPC URL found for chain ID: ${chainId}`);
  }
  return `https://${chain}.g.alchemy.com/v2/${ALCHEMY_RPC_KEY}`;
}

export const configFront = createConfig({
  chains: [sepolia, mainnet, gnosis, base],
  transports: {
    [sepolia.id]: http(getAlchemyRpcUrl(sepolia.id)),
    [mainnet.id]: http(getAlchemyRpcUrl(mainnet.id)),
    [gnosis.id]: http(getAlchemyRpcUrl(gnosis.id)),
    [base.id]: http(getAlchemyRpcUrl(base.id)),
  },
});

export const getViemClient = () => {
  const client = createPublicClient({
    chain: mainnet,
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
    chain: mainnet,
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
