import { http } from "viem";
import { createPublicClient } from "viem";
import { sepolia } from "viem/chains";
import { ANNOUNCE_CONTRACT_ADDRESS } from "../../constants/contracts";
import { getAlchemyRpcUrl } from "../../lib/wallet";

export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  })

export const getAnouncements = async () => {
    const currentBlock = await publicClient.getBlockNumber();
    const startBlock = 8700070n;
    const blockInterval = 10000n;
    let allLogs: any[] = [];

    for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += blockInterval) {
        const toBlock = (fromBlock + blockInterval) > currentBlock ? currentBlock : fromBlock + blockInterval;
        
        const logs = await publicClient.getLogs({
            address: ANNOUNCE_CONTRACT_ADDRESS,
            event: {
                type: 'event',
                name: 'Announcement', 
                inputs: [
                    { type: 'uint256', indexed: true, name: 'schemeId' },
                    { type: 'address', indexed: true, name: 'stealthAddress' },
                    { type: 'address', indexed: true, name: 'caller' },
                    { type: 'bytes', indexed: false, name: 'ephemeralPubKey' },
                    { type: 'bytes', indexed: false, name: 'metadata' },
                ]
            },
            strict: false,
            fromBlock,
            toBlock
        });

        allLogs = [...allLogs, ...logs];
    }

    return allLogs;
}