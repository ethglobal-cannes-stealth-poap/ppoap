import { useState, useEffect } from "react";
import Layout from "../components/layout";
import axios from "axios";

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

interface AddressPOAPs {
  address: string;
  poaps: POAP[];
  loading: boolean;
  error: string | null;
}

export default function Gallery() {
  const addresses = [
    "0xDB1B7053d9b2989712d97AAE36602d8B9ff59760",
    "0xbc60d23a20e39658543ad4e6f95870f5353a1551",
    "0x5dcedda3385f448a1ebc62805ff250f8b41aa8c7",
    "0x5d56fadfb7559e606e6ccd1d007765d167407f53",
    "0x367ccd20bd663b202ce38de405c4257939a61166",
    "0x60ca9ec98f219c8542d2c820361233a619508599",
    "0x444ed899e93632c1a3611ad7c6f8a1b04dd05843",
    "0x8ad305877d25ec2f318066152cd8e78234948b37",
    "0x416d9d10cc8097a9ea568de9ee09672b735f4d72",
    "0xec418509235342f5a1e782386bebcfd30834cf42",
    "0x9ae765c9d6357b3d3b34b490c5a39a28d7a96aad",
    "0x4b73298000c9f1105be393cbb4197dc58b5d3172",
    "0xa91d405230bd93d873c98c9ed96285775ec1dc1a",
    "0x3d83d583fa575661202830323b881be02383b19f",
    "0xad47ab7def67d26acfb46584e98fd652b33b5060",
  ];

  const [addressData, setAddressData] = useState<AddressPOAPs[]>(
    addresses.map((addr) => ({
      address: addr,
      poaps: [],
      loading: true,
      error: null,
    }))
  );

  const fetchPOAPsForAddress = async (address: string, index: number) => {
    try {
      const response = await axios.get(`/api/poap/address/${address}`);
      setAddressData((prev) => {
        const newData = [...prev];
        newData[index] = {
          ...newData[index],
          poaps: response.data,
          loading: false,
        };
        return newData;
      });
    } catch (error) {
      setAddressData((prev) => {
        const newData = [...prev];
        newData[index] = {
          ...newData[index],
          error: "Failed to fetch POAPs",
          loading: false,
        };
        return newData;
      });
    }
  };

  // Fetch all POAPs on component mount
  useEffect(() => {
    addresses.forEach((address, index) => {
      fetchPOAPsForAddress(address, index);
    });
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">POAP Gallery</h1>

        <div className="space-y-4">
          {addressData.map((data, index) => (
            <div
              key={data.address}
              className="collapse collapse-arrow bg-base-200"
            >
              <input type="checkbox" />
              <div className="collapse-title text-xl font-medium">
                <div className="flex justify-between items-center">
                  <span className="font-mono">
                    {formatAddress(data.address)}
                  </span>
                  <span className="badge badge-primary badge-lg">
                    {data.loading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      `${data.poaps.length} POAPs`
                    )}
                  </span>
                </div>
              </div>
              <div className="collapse-content">
                {data.loading && (
                  <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                )}

                {data.error && (
                  <div className="alert alert-error">
                    <span>{data.error}</span>
                  </div>
                )}

                {!data.loading && !data.error && data.poaps.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
                    {data.poaps.map((poap) => (
                      <div
                        key={poap.tokenId}
                        className="card card-compact bg-base-100 shadow-xl"
                      >
                        <figure className="px-4 pt-4">
                          <img
                            src={poap.event.image_url}
                            alt={poap.event.name}
                            className="rounded-xl h-32 w-32 object-cover"
                          />
                        </figure>
                        <div className="card-body">
                          <h3 className="card-title text-sm">
                            {poap.event.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              poap.event.start_date
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            #{poap.tokenId}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!data.loading && !data.error && data.poaps.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No POAPs found for this address
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
