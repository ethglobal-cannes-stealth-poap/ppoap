import { createConfig } from '@privy-io/wagmi';
import { sepolia } from 'viem/chains';
import { http } from 'wagmi';

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});