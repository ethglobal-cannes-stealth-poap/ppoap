'use client';

import Layout from "../components/layout";
import axios from "axios";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { initializeStealthAddress } from "../utils/pass-keys";
import toast from "react-hot-toast";
import { useState } from "react";
import { cleanLongBoii } from "../utils/format";
import { scanForStealthAssets } from "../utils/stealth-scanner";

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

export default function Gallery() {
  const router = useRouter();
  const [longBoii, setLongBoii] = useState<string | null>(null);
  const [viewingPrivateKey, setViewingPrivateKey] = useState<string | null>(null);
  const [spendingPublicKey, setSpendingPublicKey] = useState<string | null>(null);

  const { mutate: generateStealthAddy, isPending: isGeneratingStealthAddress } = useMutation({
    mutationFn: async () => {
      const data = await initializeStealthAddress()

      setViewingPrivateKey(data.viewingPrivateKey);
      setSpendingPublicKey(data.spendingPublicKey);

      const rawLongBoii = data.stealthMetaAddress;

      // Slice to get the last 134 characters
      setLongBoii(cleanLongBoii(rawLongBoii))
      toast.success("Connected successfully!");
    }
  });

  const { data: addressData } = useQuery({
    queryKey: ['poaps', 'multiple-addresses', longBoii],
    queryFn: async () => {
      if (!longBoii || !viewingPrivateKey || !spendingPublicKey) {
        return [];
      }

      const stealthAddresses = await scanForStealthAssets({
        viewingPrivateKey: viewingPrivateKey as string,
        spendingPublicKey: spendingPublicKey as string,
      });

      const addresses = stealthAddresses.filter((address) => address !== undefined) as string[];

      console.log("addresses", addresses);

      const results = await Promise.allSettled(
        addresses.map(async (address) => {
          try {
            const poaps = await fetchPOAPsForAddress(address);

            return {
              address,
              poaps,
              loading: false,
              error: null,
            };
          } catch (error) {
            return {
              address,
              poaps: [],
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
            loading: false,
            error: "Failed to fetch POAPs",
          };
        }
      });
    },
    enabled: !!longBoii,
  });

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

            <div className="text-center mb-8">
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
            </div>

            {longBoii && (
              <div className="anon-address-display mb-8">
                <div className="anon-label">Connected Address</div>
                <div className="anon-address">{longBoii}</div>
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
                            <div className="text-center mb-3">
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
