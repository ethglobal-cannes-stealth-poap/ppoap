'use client';

import Layout from "../components/layout";
import axios from "axios";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { initializeStealthAddress } from "../utils/pass-keys";
import toast from "react-hot-toast";
import { useState } from "react";
import { cleanLongBoii, copyToClipboard, truncateAddress } from "../utils/format";
import { scanForStealthAssets } from "../utils/stealth-scanner";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, getContract, http } from "viem";
import { gnosis } from "viem/chains";
import { getAlchemyRpcUrl } from "../lib/wallet";
import { useAccount } from "wagmi";
import { generateStealthPrivateKey } from "../utils/stealth-private-key";
import { useSendTransaction } from '@privy-io/react-auth';
import { useConnectWallet } from '@privy-io/react-auth';
import POAP_CONTRACT_ABI from "../constants/abi/poap-contract.json";

interface POAP {
  tokenId: string;
  owner: string;
  chain: string;
  created: string;
  event: {
    id: number;
    fancy_id: string;
    name: string;
    event_url: string;
    image_url: string;
    country: string;
    city: string;
    description: string;
    year: number;
    start_date: string;
    end_date: string;
    expiry_date: string;
    supply: number;
  };
}

export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};


const fetchPOAPsForAddress = async (address: string): Promise<POAP[]> => {
  const response = await axios.get(`/api/poap/address/${address}`);
  return response.data;
};

const publicClient = createPublicClient({
  chain: gnosis,
  transport: http(getAlchemyRpcUrl(gnosis.id))
});

export default function Gallery() {
  const router = useRouter();
  const [longBoii, setLongBoii] = useState<string | null>(null);
  const [viewingPrivateKey, setViewingPrivateKey] = useState<string | null>(null);
  const [spendingPublicKey, setSpendingPublicKey] = useState<string | null>(null);
  const [spendingPrivateKey, setSpendingPrivateKey] = useState<string | null>(null);
  const { address: connectedAccount } = useAccount()
  const { sendTransaction } = useSendTransaction();
  // @ts-ignore
  const { connectWallet, isConnected } = useConnectWallet();


  const { mutate: generateStealthAddy, isPending: isGeneratingStealthAddress } = useMutation({
    mutationFn: async () => {
      const data = await initializeStealthAddress()

      setViewingPrivateKey(data.viewingPrivateKey);
      setSpendingPublicKey(data.spendingPublicKey);
      setSpendingPrivateKey(data.spendingPrivateKey);

      const rawLongBoii = data.stealthMetaAddress;

      // Slice to get the last 134 characters
      setLongBoii(cleanLongBoii(rawLongBoii))
      toast.success("Connected successfully!");
    }
  });

  const { data: addressData, isLoading } = useQuery({
    queryKey: ['poaps', 'multiple-addresses', longBoii],
    queryFn: async () => {
      if (!longBoii || !viewingPrivateKey || !spendingPublicKey) {
        return [];
      }

      const { stealthAddresses, stealhAddressData } = await scanForStealthAssets({
        viewingPrivateKey: viewingPrivateKey as string,
        spendingPublicKey: spendingPublicKey as string,
      });

      const addresses = stealthAddresses.filter((address) => address !== undefined) as string[];

      const results = await Promise.allSettled(
        addresses.map(async (address, i) => {
          try {
            const poaps = await fetchPOAPsForAddress(address);

            return {
              address,
              poaps,
              stealthAddressData: stealhAddressData[i],
              loading: false,
              error: null,
            };
          } catch (error) {
            return {
              address,
              poaps: [],
              stealthAddressData: null,
              loading: false,
              error: "Failed to fetch POAPs",
            };
          }
        })
      );

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            address: addresses[index],
            poaps: [],
            stealthAddressData: stealhAddressData[index],
            loading: false,
            error: "Failed to fetch POAPs",
          };
        }
      });
    },
    enabled: !!longBoii,
  });

  const prepareAndTransfer = async (
    ephemeralPublicKey: string,
    tokenId: string
  ) => {
    if (!spendingPrivateKey || !spendingPublicKey) {
      return;
    }

    try {
      const stealthPrivateKey = generateStealthPrivateKey(
        ephemeralPublicKey as string,
        viewingPrivateKey as string,
        spendingPrivateKey as string,
      )

      const stealthAddressAccount = privateKeyToAccount(stealthPrivateKey as `0x${string}`);
      const stealthWalletClient = createWalletClient({
        account: stealthAddressAccount,
        chain: gnosis,
        transport: http(getAlchemyRpcUrl(gnosis.id))
      });

      const stealthAddressBalance = await publicClient.getBalance({
        address: stealthAddressAccount.address as `0x${string}`,
      })

      const gasEstimate = await publicClient.estimateContractGas({
        address: "0x22c1f6050e56d2876009903609a2cc3fef83b415" as `0x${string}`,
        abi: POAP_CONTRACT_ABI,
        functionName: "transferFrom",
        args: [
          stealthAddressAccount.address as `0x${string}`,
          connectedAccount as `0x${string}`,
          BigInt(tokenId),
        ],
        account: stealthAddressAccount,
      });

      const gasBufferMultiplier = 105n; // 5% buffer
      const requiredGas = (gasEstimate * gasBufferMultiplier) / 100n;

      if (stealthAddressBalance < gasEstimate) {
        toast.error("Insufficient balance to cover gas fees");
        sendTransaction({
          to: stealthAddressAccount.address as `0x${string}`,
          value: requiredGas - stealthAddressBalance,
          chainId: gnosis.id,
        }, {
          address: connectedAccount as `0x${string}`,
        });

      }

      const contract = getContract({
        address: "0x22c1f6050e56d2876009903609a2cc3fef83b415" as `0x${string}`,
        abi: POAP_CONTRACT_ABI,
        client: {
          public: publicClient,
          wallet: stealthWalletClient,
        }
      })

      if (!contract || !contract?.write) {
        toast.error("Failed to get contract instance");
        return;
      }

      // @ts-ignore
      await contract.write.transferFrom([
        stealthAddressAccount.address as `0x${string}`,
        connectedAccount as `0x${string}`,
        tokenId,
      ])
    } catch (error) {
      console.error("Transfer failed:", error);
      toast.error("Transfer failed. Please try again.");
      return;
    }
  }

  return (
    <Layout>
      <div className="App">
        <div className="app-wrapper">
          <div className="background-elements">
            <div className="star star-1">⭐</div>
            <div className="star star-2">✨</div>
            <div className="star star-3">⭐</div>
            <div className="star star-4">✨</div>
            <div className="star star-5">⭐</div>
            <div className="star star-6">✨</div>
            <div className="star star-7">⭐</div>
            <div className="star star-8">✨</div>
            <div className="star star-9">⭐</div>
            <div className="star star-10">✨</div>
            <div className="cloud cloud-1">☁️</div>
            <div className="cloud cloud-2">☁️</div>
            <div className="cloud cloud-3">☁️</div>
            <div className="cloud cloud-4">☁️</div>
            <div className="cloud cloud-5">☁️</div>
          </div>

          <div className="main-content mt-[120px] pb-10">
            <h1 className="text-center mt-12 mb-8 text-2xl font-semibold text-gray-800">My POAP Gallery</h1>

            {isConnected && (
              <div className="text-center mb-8">
                <div className="text-center mb-8">
                  <p>
                    To claim POAPs, you need to connect your wallet.
                  </p>

                </div>
                <button
                  onClick={() => connectWallet()}
                  className="connect-wallet-button"
                >
                  Connect Wallet
                </button>
              </div>
            )}

            {!longBoii && <div className="text-center mb-8">
              <button
                onClick={() => generateStealthAddy()}
                className="connect-wallet-button"
                disabled={isGeneratingStealthAddress}
              >
                {isGeneratingStealthAddress ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading-spinner-small"></span>
                    Connecting...
                  </span>
                ) : (
                  'Connect Passkey'
                )}
              </button>
            </div>}

            {longBoii && (
              <div
                className="connected-address-display cursor-pointer hover:bg-opacity-100 transition-all duration-200 flex justify-between"
                onClick={() => copyToClipboard(longBoii)}
                title="Click to copy address"
              >
                <div className="connected-address-label">Connected:</div>
                <div className="flex">
                  <div className="connected-address-value">{truncateAddress(longBoii)}</div>
                  <div className="copy-indicator">📋</div>
                </div>
              </div>
            )}

            {/* Empty state when not connected */}
            {!longBoii && (
              <div className="empty-state-card">
                <div className="text-5xl mb-5">🔐</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Connect Your Passkey
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Connect your passkey to view your private POAP collection and manage your addresses securely.
                </p>
              </div>
            )}

            {/* Empty state when connected but no addresses/POAPs */}
            {longBoii && addressData && addressData.length === 0 && (
              <div className="empty-state-card">
                <div className="text-5xl mb-5">🎭</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  No POAPs Found
                </h3>
                <p className="text-gray-600 text-base leading-relaxed mb-5">
                  You haven't added any addresses to your collection yet. Start by adding an address to view your POAPs.
                </p>
                <div className="empty-state-tip">
                  💡 Tip: Add addresses from POAP events you've attended to build your collection
                </div>
              </div>
            )}

            <div className="poap-gallery">
              {/* Loading state with skeleton cards */}
              {isLoading && (
                <div className="address-section-card">
                  <div className="address-header">
                    <div className="skeleton skeleton-text w-32 h-5"></div>
                    <div className="skeleton skeleton-badge w-20 h-8"></div>
                  </div>
                  <div className="poap-grid">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="poap-card-skeleton">
                        <div className="skeleton skeleton-image"></div>
                        <div className="skeleton skeleton-text w-full h-4 mt-3"></div>
                        <div className="skeleton skeleton-text w-3/4 h-3 mt-2"></div>
                        <div className="skeleton skeleton-text w-1/2 h-3 mt-1"></div>
                        <div className="skeleton skeleton-button w-full h-10 mt-3"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addressData?.filter((data) => data.poaps.length > 0)?.map((data, index) => (
                <div
                  key={data.address}
                  className="address-section-card"
                >
                  <div
                    className="address-header"
                    onClick={() => {
                      const section = document.getElementById(`address-${index}`);
                      if (section) {
                        section.style.display = section.style.display === 'none' ? 'block' : 'none';
                      }
                    }}
                  >
                    <span className="address-text">
                      {data?.address ? formatAddress(data?.address) : "-"}
                    </span>
                    <div className="poap-count-badge">
                      {data.loading ? (
                        <span className="loading-spinner-small"></span>
                      ) : (
                        `${data.poaps.length} POAPs`
                      )}
                    </div>
                  </div>

                  <div id={`address-${index}`} className="block">
                    {data.loading && (
                      <div className="text-center py-10">
                        <div className="loading-spinner mx-auto"></div>
                      </div>
                    )}

                    {data.error && (
                      <div className="error-message">
                        {data.error}
                      </div>
                    )}

                    {!data.loading && !data.error && data.poaps.length > 0 && (
                      <div className="poap-grid">
                        {data.poaps.map((poap) => (
                          <div
                            key={poap.tokenId}
                            className="poap-card"
                            onClick={() => router.push(`/poap/${poap.tokenId}`)}
                          >
                            <div className="text-center mb-3 w-full flex justify-center">
                              <img
                                src={poap.event.image_url}
                                alt={poap.event.name}
                                className="poap-card-image"
                              />
                            </div>
                            <h3 className="poap-card-title">
                              {poap.event.name}
                            </h3>
                            <div className="poap-card-date">
                              {new Date(poap.event.start_date).toLocaleDateString()}
                            </div>
                            <div className="poap-card-token">
                              #{poap.tokenId}
                            </div>

                            <button
                              className="mt-3 transfer-button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                prepareAndTransfer(data.stealthAddressData?.ephemeralPubKey as string, poap.tokenId)
                              }}>
                              Transfer POAP
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {!data.loading && !data.error && data.poaps.length === 0 && (
                      <div className="address-empty-state">
                        <div className="text-3xl mb-3">🎫</div>
                        <p className="text-gray-600 text-sm mb-2">
                          No POAPs found for this address
                        </p>
                        <p className="text-gray-400 text-xs">
                          This address may not have attended any POAP events yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
