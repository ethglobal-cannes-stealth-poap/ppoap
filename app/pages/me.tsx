'use client';

import Layout from "../components/layout";
import axios from "axios";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { initializeStealthAddress } from "../utils/pass-keys";
import toast from "react-hot-toast";
import { generateStealthAddress } from "../utils/stealth-address";
import { useState } from "react";
import { getItem, getKey } from "../lib/userDb";
import { cleanLongBoii } from "../utils/format";

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

// const addresses = [
//   "0xDB1B7053d9b2989712d97AAE36602d8B9ff59760",
//   "0xbc60d23a20e39658543ad4e6f95870f5353a1551",
//   "0x5dcedda3385f448a1ebc62805ff250f8b41aa8c7",
//   "0x5d56fadfb7559e606e6ccd1d007765d167407f53",
//   "0x367ccd20bd663b202ce38de405c4257939a61166",
//   "0x60ca9ec98f219c8542d2c820361233a619508599",
//   "0x444ed899e93632c1a3611ad7c6f8a1b04dd05843",
//   "0x8ad305877d25ec2f318066152cd8e78234948b37",
//   "0x416d9d10cc8097a9ea568de9ee09672b735f4d72",
//   "0xec418509235342f5a1e782386bebcfd30834cf42",
//   "0x9ae765c9d6357b3d3b34b490c5a39a28d7a96aad",
//   "0x4b73298000c9f1105be393cbb4197dc58b5d3172",
//   "0xa91d405230bd93d873c98c9ed96285775ec1dc1a",
//   "0x3d83d583fa575661202830323b881be02383b19f",
//   "0xad47ab7def67d26acfb46584e98fd652b33b5060",
// ];

export default function Gallery() {
  const router = useRouter();
  const [longBoii, setLongBoii] = useState<string | null>(null);

  const { mutate: generateStealthAddy, isPending: isGeneratingStealthAddress } = useMutation({
    mutationFn: async () => {
      const data = await initializeStealthAddress()
      const rawLongBoii = data.stealthMetaAddress;

      // Slice to get the last 134 characters
      setLongBoii(cleanLongBoii(rawLongBoii))
      toast.success("Connected successfully!");
    }
  });

  const { data: addressData, isLoading } = useQuery({
    queryKey: ['poaps', 'multiple-addresses', longBoii],
    queryFn: async () => {
      if (!longBoii) {
        return [];
      }

      const key = getKey(longBoii);
      const addresses = getItem<string[]>(key) || [];
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

          <div className="main-content" style={{ marginTop: '120px', paddingBottom: '40px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>My POAP Gallery</h1>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button
                onClick={() => generateStealthAddy()}
                className="connect-wallet-button"
                disabled={isGeneratingStealthAddress}
              >
                {isGeneratingStealthAddress ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', margin: '0' }}></span>
                    Connecting...
                  </span>
                ) : (
                  'Connect Passkey'
                )}
              </button>
            </div>

            {longBoii && (
              <div className="anon-address-display" style={{ marginBottom: '30px' }}>
                <div className="anon-label">Connected Address</div>
                <div className="anon-address">{longBoii}</div>
              </div>
            )}

            <div className="poap-gallery">
              {addressData?.map((data, index) => (
                <div
                  key={data.address}
                  className="address-section"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 192, 229, 0.2)'
                  }}
                >
                  <div
                    className="address-header"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const section = document.getElementById(`address-${index}`);
                      if (section) {
                        section.style.display = section.style.display === 'none' ? 'block' : 'none';
                      }
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: '16px', color: '#2c3e50', fontWeight: '600' }}>
                      {data?.address ? formatAddress(data?.address) : "-"}
                    </span>
                    <div
                      className="poap-count-badge"
                      style={{
                        background: 'rgba(0, 192, 229, 0.5)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(0, 192, 229, 0.5)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 4px 16px rgba(0, 192, 229, 0.2)'
                      }}
                    >
                      {data.loading ? (
                        <span className="loading-spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', margin: '0' }}></span>
                      ) : (
                        `${data.poaps.length} POAPs`
                      )}
                    </div>
                  </div>

                  <div id={`address-${index}`} style={{ display: 'block' }}>
                    {data.loading && (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                      </div>
                    )}

                    {data.error && (
                      <div style={{
                        background: '#ffebee',
                        border: '1px solid #f44336',
                        borderRadius: '8px',
                        padding: '16px',
                        color: '#c62828',
                        fontSize: '14px'
                      }}>
                        {data.error}
                      </div>
                    )}

                    {!data.loading && !data.error && data.poaps.length > 0 && (
                      <div className="poap-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '16px',
                        marginTop: '16px'
                      }}>
                        {data.poaps.map((poap) => (
                          <div
                            key={poap.tokenId}
                            className="poap-card"
                            style={{
                              background: 'white',
                              borderRadius: '12px',
                              padding: '16px',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              border: '1px solid rgba(0, 192, 229, 0.1)'
                            }}
                            onClick={() => router.push(`/poap/${poap.tokenId}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 192, 229, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                            }}
                          >
                            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                              <img
                                src={poap.event.image_url}
                                alt={poap.event.name}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '3px solid rgba(0, 192, 229, 0.3)'
                                }}
                              />
                            </div>
                            <h3 style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#2c3e50',
                              marginBottom: '8px',
                              lineHeight: '1.3',
                              textAlign: 'center'
                            }}>
                              {poap.event.name}
                            </h3>
                            <div style={{
                              fontSize: '12px',
                              color: '#666',
                              textAlign: 'center',
                              marginBottom: '4px'
                            }}>
                              {new Date(poap.event.start_date).toLocaleDateString()}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#00c0e5',
                              textAlign: 'center',
                              fontWeight: '600'
                            }}>
                              #{poap.tokenId}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!data.loading && !data.error && data.poaps.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: '#666',
                        fontSize: '14px'
                      }}>
                        No POAPs found for this address
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!longBoii && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666',
                fontSize: '16px'
              }}>
                Connect your passkey to view your POAP collection
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
