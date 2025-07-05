import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../../components/layout";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";

interface POAPDetails {
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

export default function POAPPage() {
  const router = useRouter();
  const { tokenId, success } = router.query;
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    data: poap,
    isLoading,
    error,
  } = useQuery<POAPDetails>({
    queryKey: ["poap", tokenId],
    queryFn: async () => {
      if (!tokenId) throw new Error("No token ID provided");

      const response = await axios.get(`/api/poap/token/${tokenId}`);
      return response.data;
    },
    enabled: !!tokenId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Layout>
    );
  }

  if (error || !poap) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">POAP Not Found</h2>
            <p className="text-gray-600 mb-6">
              The POAP with token ID #{tokenId} could not be found.
            </p>
            <button
              onClick={() => router.push("/gallery")}
              className="btn btn-primary"
            >
              Back to Gallery
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="card lg:card-side bg-base-100 shadow-xl">
          <figure className="lg:w-1/2 p-8 bg-gradient-to-br from-purple-50 to-pink-50">
            <img
              src={poap.event.image_url}
              alt={poap.event.name}
              className="rounded-xl w-full max-w-sm mx-auto"
            />
          </figure>
          <div className="card-body lg:w-1/2">
            <div className="mb-4">
              <div className="badge badge-secondary badge-lg">
                Token #{poap.tokenId}
              </div>
            </div>

            <h2 className="card-title text-3xl mb-4">{poap.event.name}</h2>

            {poap.event.description && (
              <p className="text-gray-600 mb-6">{poap.event.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Owner:</span>
                <span className="font-mono text-sm">
                  {formatAddress(poap.owner)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">Event Date:</span>
                <span>{formatDate(poap.event.start_date)}</span>
              </div>

              {poap.event.city && poap.event.country && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Location:</span>
                  <span>
                    {poap.event.city}, {poap.event.country}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="font-semibold">Year:</span>
                <span>{poap.event.year}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">Supply:</span>
                <span>{poap.event.supply.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">Minted:</span>
                <span>{formatDate(poap.created)}</span>
              </div>
            </div>

            <div className="card-actions justify-end mt-8">
              {poap.event.event_url && (
                <a
                  href={poap.event.event_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  View Event
                </a>
              )}
              <button
                onClick={() => router.push("/gallery")}
                className="btn btn-primary"
              >
                Back to Gallery
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
