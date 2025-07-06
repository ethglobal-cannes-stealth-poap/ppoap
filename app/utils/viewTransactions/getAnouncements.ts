import { http, parseAbiItem } from "viem";
import { createPublicClient } from "viem";
import { sepolia } from "viem/chains";
import messageContract from '../../constants/abi/5564.json'
import { ANNOUNCE_CONTRACT_ADDRESS } from "../../constants/contracts";

export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  })

export const getAnouncements = async () => {
    const logs = await publicClient.getLogs({  
        address: "0x55649E01B5Df198D18D95b5cc5051630cfD45564",
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
        fromBlock: 8700070n,
    })

    return logs;
}