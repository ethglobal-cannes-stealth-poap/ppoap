import { createConfig } from '@privy-io/wagmi';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { createPublicClient } from 'viem';

const ALCHEMY_RPC_URL = process.env.REACT_APP_ALCHEMY_RPC_URL;
if (!ALCHEMY_RPC_URL) {
  throw new Error("REACT_APP_ALCHEMY_RPC_URL is not defined. Please set it in your .env file.");
}

export const CHAIN_ID = sepolia.id;

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: [
      http(ALCHEMY_RPC_URL),
      http()
    ],
  },
});

export const getViemClient = () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
    batch: {
      multicall: !!sepolia.contracts?.multicall3?.address
    }
  });

  return client;
};

export const fetchEventsViem = async ({
  client,
  address,
  event,
  args,
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
}

export const getEvent = (abi, eventName) => {
  return (abi).find((item) => {
    return item.type === "event" && item?.name === eventName;
  });
}
