import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import MintResponse from "./MintResponse";
import { useReadMetaAddress } from "../utils/viewTransactions/getMetaAddress";
import { useEnsAddress, useWriteContract } from "wagmi";
import { ANNOUNCE_CONTRACT_ADDRESS } from "../constants/contracts";
import Contract5564 from "../constants/abi/5564.json"
import { setMetaStealthAddress } from "../utils/writeTransactions/setMetaStealthAddress";
import { StealthAddressInfo } from "../types";
import { generateStealthAddress } from "../utils/stealth-address";
import { getItem, getKey, setItem } from "../lib/userDb";
import { PoapClaimFullForm } from "./PoapClaimFullForm";
import { PoapClaimBroadcast } from "./PoapClaimBroadcast";
import { cleanLongBoii } from "../utils/format";
import { initializeStealthAddress } from "../utils/pass-keys";
import toast from "react-hot-toast";

const schemaId = 1;

interface MintResponse {
  id: string;
  beneficiary: string;
  event: {
    name: string;
  };
  claimed: boolean;
  claimed_date?: string;
  qr_hash?: string;
}

interface PoapClaimProps {
  poapId: string
}

const longBoiEmpty = "st:eth:0x";

function PoapClaim({ poapId }: PoapClaimProps) {
  const [ens, setEns] = useState("");
  const [mintResponse, setMintResponse] = useState<MintResponse | null>(null);
  const { writeContract } = useWriteContract()
  const [startBroadcasting, setStartBroadcasting] = useState(false);

  const [resolvedStealthAddressInfo, setResolvedStealthAddressInfo] = useState<StealthAddressInfo | null>(null);
  const [metaAddressInfo, setMetaAddressInfo] = useState<{
    stealthMetaAddress: string;
    spendingPrivateKey: string;
    viewingPrivateKey: string;
    spendingPublicKey: string;
    viewingPublicKey: string;
    viewTag: string;
    credentialUsed: string;
  } | null>(null);

  const { data: ensAddress } = useEnsAddress({
    name: ens.trim(),
    chainId: 1,
    query: {
      enabled: !!ens.endsWith('.eth') && !!ens.trim() && ens.trim() !== "",
    }
  })

  const { data: poap, isLoading: isLoadingPoap } = useQuery({
    queryKey: ["poap", poapId],
    queryFn: async () => {
      if (!poapId) {
        throw new Error("No poapId provided");
      }

      try {
        const response = await axios.get(
          `/api/poap/validate?poapId=${poapId}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = response.data;

        if (!data) {
          throw new Error("No data found in response");
        }

        const transformedData = {
          id: data.id || data.event?.id,
          name: data.name || data.event?.name || "POAP Event",
          description: data.description || data.event?.description || "",
          image_url: data.image_url || data.image || data.event?.image_url,
          start_date: data.start_date || data.event?.start_date,
          end_date: data.end_date || data.event?.end_date,
          claim_name: poapId,
          event: data.event || data,
          ...data,
        };

        return transformedData;
      } catch (err: any) {
        if (err.response?.status) {
          throw new Error(
            `Invalid claim name: ${poapId} (${err.response.status})`
          );
        }
        throw new Error(
          err.message || `Failed to fetch POAP data for: ${poapId}`
        );
      }
    },
  });

  const { mutate: setMetaAddy } = useMutation({
    mutationFn: async (stealthMetaAddress: string) => {
      console.log("calling setMetaAddy");
      if (!stealthMetaAddress) {
        throw new Error("No stealth meta address provided");
      }
      console.log("passed the if");
      const res = await setMetaStealthAddress({ stealthMetaAddress });
      console.log("Meta address set successfully:", res);
    },
  });

  // look into logic ere
  const { data: stealthMetaAddress } = useReadMetaAddress({ address: ensAddress as string });

  const resolvedStealthMetaAddress = useMemo(() => {
    if (metaAddressInfo?.stealthMetaAddress) {
      return metaAddressInfo.stealthMetaAddress;
    }

    return `st:eth:${stealthMetaAddress}`;
  }, [metaAddressInfo, stealthMetaAddress]);

  const hasLongBoii = useMemo(() => {
    return !!resolvedStealthMetaAddress && cleanLongBoii(resolvedStealthMetaAddress) !== longBoiEmpty;
  }, [resolvedStealthMetaAddress]);

  useEffect(() => {
    if (!hasLongBoii && !!resolvedStealthMetaAddress) {
      setMetaAddy(resolvedStealthMetaAddress as string)
    }
  }, [hasLongBoii, resolvedStealthMetaAddress, setMetaAddy]);

  const announceStealthAddressMint = async (stealthAddress: string, ephemeralPubKey: string, metadata: string) => {
    const res = await writeContract({
      abi: Contract5564,
      address: ANNOUNCE_CONTRACT_ADDRESS,
      functionName: "announce",
      args: [schemaId, stealthAddress, ephemeralPubKey, metadata],
    })
    console.log("res", res);
  }

  const performMint = async (address: string) => {
    try {
      const response = await axios.post(
        "/api/poap/mint",
        {
          poapId: poapId,
          address: address,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (err: any) {
      console.log("Mint API error:", err.response?.data || err.message);
      throw new Error(
        `Mint failed (${err.response?.status || "Network Error"}): ${err.response?.data?.error || err.message
        }`
      );
    }
  };

  const mintPoapMutation = useMutation({
    mutationFn: async (reciever: string) => {
      if (!resolvedStealthAddressInfo) {
        throw new Error("No stealth address info provided. Please generate an anon address first.");
      }

      const response = await performMint(reciever);
      if (response.claimed) {
        setStartBroadcasting(true);
        await announceStealthAddressMint(resolvedStealthAddressInfo.stealthAddress, resolvedStealthAddressInfo.ephemeralPublicKey, resolvedStealthAddressInfo.viewTag);
        setMintResponse(response as unknown as MintResponse);

        if (!metaAddressInfo?.stealthMetaAddress) {
          console.error("Meta address info is not provided. Cannot store stealth address.");
          return
        }

        const key = getKey(metaAddressInfo?.stealthMetaAddress)
        const addresses = getItem<string[]>(key) || [];
        console.log("Current addresses in localStorage:", addresses);
        setItem(key, [
          ...addresses,
          resolvedStealthAddressInfo.stealthAddress.toLowerCase(),
        ]);
      }
    }
  })

  const { mutate: setUpPasskeys } = useMutation({
    mutationFn: async () => {
      const data = await initializeStealthAddress()
      setMetaAddressInfo(data)

      const stealthAddressData = await generateStealthAddress(data.stealthMetaAddress)
      setResolvedStealthAddressInfo(stealthAddressData)

      setMetaAddy(data.stealthMetaAddress);
    },
    onSuccess: () => {
      toast.success("Passkeys are ready.");
    }
  });

  const generateStealthAddressMutation = useMutation({
    mutationFn: async (stealthMetaAddress: string) => {
      if (!stealthMetaAddress) {
        throw new Error("No stealth meta address provided");
      }

      const data = await generateStealthAddress(stealthMetaAddress)
      setResolvedStealthAddressInfo(data)
    },
  })

  if (isLoadingPoap) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading POAP...</p>
      </div>
    );
  }

  if (!isLoadingPoap && !poap) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <h2>POAP Not Found</h2>
        {poapId && <p className="error-details">Claim Name: {poapId}</p>}
        <p className="how-to">
          Please provide a claim name in the URL: /claim/your-claim-name
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="background-elements">
        <div className="star star-1">✦</div>
        <div className="star star-2">✦</div>
        <div className="star star-3">✦</div>
        <div className="star star-4">✦</div>
        <div className="star star-5">✦</div>
        <div className="star star-6">✦</div>
        <div className="star star-7">✦</div>
        <div className="star star-8">✦</div>
        <div className="star star-9">✦</div>
        <div className="star star-10">✦</div>
        <div className="star star-11">✦</div>
        <div className="star star-12">✦</div>
        <div className="cloud cloud-1">☁</div>
        <div className="cloud cloud-2">☁</div>
        <div className="cloud cloud-3">☁</div>
        <div className="cloud cloud-4">☁</div>
        <div className="cloud cloud-5">☁</div>
        <div className="cloud cloud-6">☁</div>
        <div className="cloud cloud-7">☁</div>
        <div className="cloud cloud-8">☁</div>
      </div>

      <div className="poap-container">
        <div className="poap-content">
          <div className="avatar-container">
            <div className="avatar">
              <img
                src={
                  poap?.image_url ||
                  poap?.image ||
                  "https://via.placeholder.com/150x150?text=POAP"
                }
                alt={poap?.name || "POAP"}
                className="avatar-image"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <h1>{poap?.name || poap?.description || "POAP Event"}</h1>
        <div className="date-info">
          📅 {poap?.start_date ? formatDate(poap.start_date) : "Date TBD"}
          {poap?.end_date && poap.end_date !== poap.start_date
            ? ` - ${formatDate(poap.end_date)}`
            : ""}
        </div>

        <div className="collect-section">
          {
            !startBroadcasting && (
              <PoapClaimFullForm
                ens={ens}
                setEns={setEns}
                isInRegistry={hasLongBoii}
                generateStealthAddressMutation={generateStealthAddressMutation}
                resolvedStealthMetaAddress={resolvedStealthMetaAddress}
                resolvedStealthAddressInfo={resolvedStealthAddressInfo}
                mintPoapMutation={mintPoapMutation}
                setUpPasskeys={setUpPasskeys}
              />
            )
          }

          {
            startBroadcasting && (
              <PoapClaimBroadcast
                startAnnounce={() => announceStealthAddressMint(resolvedStealthAddressInfo?.stealthAddress as string, resolvedStealthAddressInfo?.ephemeralPublicKey as string, resolvedStealthAddressInfo?.viewTag as string)}
              />
            )
          }
        </div>
      </div>

      {mintResponse && (
        <MintResponse mintResponse={mintResponse} />
      )}
    </>
  );
}

export default PoapClaim;
