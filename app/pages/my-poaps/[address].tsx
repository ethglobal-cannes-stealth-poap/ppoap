// @ts-nocheck
import { useState } from 'react';
import { useRouter } from 'next/router';
import { usePrivy } from '@privy-io/react-auth';
import Layout from '../../components/layout';
import { initializeStealthAddress } from '../../utils/pass-keys.js';
import { scanForStealthAssets } from '../../utils/stealth-scanner.js';
import Head from 'next/head';
import { truncateAddress } from '../../utils/format';

interface Poap {
  event: {
    id: number;
    name: string;
    image_url: string;
  };
  tokenId: string;
  owner: string;
}

export default function MyPoapsPage() {
  const router = useRouter();
  const { address } = router.query;
  const { ready, authenticated, user } = usePrivy();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundPoaps, setFoundPoaps] = useState<Poap[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const isOwner = ready && authenticated && user?.wallet?.address.toLowerCase() === (address as string)?.toLowerCase();

  const handleScan = async () => {
    if (!isOwner) {
      setError("You can only scan for POAPs for a wallet you are logged in with.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setFoundPoaps([]);
    setHasScanned(true);

    try {
      const userKeys = await initializeStealthAddress();
      if (!userKeys.viewingPrivateKey || !userKeys.spendingPublicKey) {
        throw new Error("Could not retrieve stealth keys from passkey. Please try again.");
      }

      const poaps = await scanForStealthAssets(userKeys);
      console.log("poaps found:", poaps);
      setFoundPoaps(poaps);
    } catch (err: any) {
      console.error("Scan failed:", err);
      setError(err.message || 'An unknown error occurred during the scan.');
    } finally {
      setIsLoading(false);
    }
  };

  const PoapCard = ({ poap }: { poap: Poap }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <img src={poap.event.image_url} alt={poap.event.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{poap.event.name}</h3>
        <p className="text-sm text-gray-500 mt-1">Token ID: {poap.tokenId}</p>
        <p className="text-xs text-gray-400 mt-2 break-all">Owned by: {truncateAddress(poap.owner)}</p>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Stealth POAPs for {truncateAddress(address as string)}</title>
      </Head>
      <Layout>
        <div className="max-w-6xl mx-auto py-10 px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Stealth POAPs</h1>
          <p className="text-gray-600 mb-8">
            Viewing POAPs for wallet: <code className="bg-gray-200 p-1 rounded">{address}</code>
          </p>

          {isOwner ? (
            <div className="text-center">
              <button
                onClick={handleScan}
                disabled={isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Scanning...' : 'Scan for My Stealth POAPs'}
              </button>
            </div>
          ) : (
            <div className="text-center bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              {authenticated ? (
                <p>This page is for wallet <code className="font-bold">{truncateAddress(address as string)}</code>, but you are logged in with <code className="font-bold">{truncateAddress(user?.wallet?.address)}</code>. Please log out and reconnect with the correct wallet.</p>
              ) : (
                <p>Please log in with the wallet <code className="font-bold">{truncateAddress(address as string)}</code> to scan for its private POAPs.</p>
              )}
            </div>
          )}

          {error && <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error}</div>}

          <div className="mt-12">
            {isLoading && (
              <div className="text-center">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
                <p className="mt-4 text-gray-600">Scanning announcements and fetching POAPs...</p>
              </div>
            )}

            {!isLoading && foundPoaps.length > 0 && (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Found {foundPoaps.length} POAP(s)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {foundPoaps.map((poap, index) => <PoapCard key={`${poap.tokenId}-${index}`} poap={poap} />)}
                </div>
              </>
            )}

            {!isLoading && hasScanned && foundPoaps.length === 0 && !error && (
              <div className="text-center text-gray-500 mt-8 bg-gray-50 p-6 rounded-lg">
                <p className="text-lg">Scan complete. No POAPs found.</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}