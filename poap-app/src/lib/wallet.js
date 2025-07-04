import { createConfig } from '@privy-io/wagmi';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

/* 

 How to use this in your code:
 
  fetchEventsViem({
    client: client,
    address: contractAddress,
    event: stakedEvent,
  })

*/

export const getViemClient = () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
    batch: {
      multicall: !!viemChain.contracts?.multicall3?.address
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
    logger.error("Onchain event fetch failed", error);
    throw error;
  }
}

export const getEvent = (abi, eventName) => {
  return (abi).find((item) => {
    return item.type === "event" && item?.name === eventName;
  });
}
