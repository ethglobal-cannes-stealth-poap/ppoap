import { useQuery } from '@tanstack/react-query';
import { useWallets } from '@privy-io/react-auth';
import { getMetaAddress } from '../../utils/viewTransactions/getMetaAddress';

function Home() {
  const { wallets } = useWallets();
  const address = wallets[0]?.address;

  const { data: isInRegistry, isLoading: isGettingRegistry } = useQuery({
    queryKey: ['registry', address],
    queryFn: async () => {
      try {
        const res = await getMetaAddress({ address });
        console.log("Meta address:", res);

        return res;
      } catch (err) {
        if (err.response?.status) {
          throw new Error(`Invalid registry entry: ${address} (${err.response.status})`);
        }
        throw new Error(err.message || `Failed to fetch registry data for: ${address}`);
      }
    },
    isEnabled: !!address,
  })

  return (
    <div>
      HOME
    </div>
  );
}

export default Home;
