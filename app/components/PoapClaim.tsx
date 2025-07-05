import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import MintResponse from "./MintResponse";
import toast from "react-hot-toast";
import { useWallets } from "@privy-io/react-auth";
import { getMetaAddress } from "../utils/viewTransactions/getMetaAddress";
import { setMetaAddress } from "../utils/writeTransactions/setMetaAddress";
import { useEnsAddress, useWriteContract } from "wagmi";
import { ANNOUNCE_CONTRACT_ADDRESS } from "../constants/contracts";
import Contract5564 from "../constants/abi/5564.json"


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
  mintToAddress?: string;
  stealthAddressInfo?: {
    stealthAddress: string;
    ephemeralPubKey: string;
    metadata: string;
  } | null;
  metaAddressInfo?: {
    stealthMetaAddress: string
    spendingPrivateKey: string
    viewingPrivateKey: string
    spendingPublicKey: string
    viewingPublicKey: string
    viewTag: string
    credentialUsed: string
  } | null;

  generateStealthAddress: () => void;
}

function PoapClaim({ 
  poapId, 
  mintToAddress, 
  stealthAddressInfo, 
  metaAddressInfo,
  generateStealthAddress,
}: PoapClaimProps) {
  const [ens, setEns] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintResponse, setMintResponse] = useState<MintResponse | null>(null);
  const { writeContract } = useWriteContract()

  const { data: ensAddress } = useEnsAddress({
    name: ens.trim(),
    chainId: 1,
    query: {
      enabled: !!ens.endsWith('.eth') && !!ens.trim() && ens.trim() !== "",
    }
  })

  const { wallets } = useWallets();
  const wallet = wallets[0];

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

  const { mutate: setMetaAddy, isPending: isSettingMetaAddress } = useMutation({
    mutationFn: async (isInRegistry: boolean) => {
      try {
        if (!wallet) {
          throw new Error("No wallet connected");
        }

        if (!metaAddressInfo?.stealthMetaAddress) {
          throw new Error("No stealth meta address provided");
        }

        if (isInRegistry === false) {
          toast.error("This address is not registered in the Meta registry. Please register it first.");
          const res = await setMetaAddress({ wallet, stealthMetaAddress: metaAddressInfo?.stealthMetaAddress });
          console.log("Meta address set successfully:", res);
        }

        toast.success("Meta address registered successfully!");
      } catch (err: any) {
        console.error("Error setting meta address:", err);
        toast.error(`Failed to register meta address: ${err.message}`);
      }
    },
  });

  const { data: isInRegistry = false, isLoading: isCheckingRegistry } = useQuery({
    queryKey: ["isRegistered", ensAddress],
    queryFn: async () => {
      if (!ensAddress) {
        throw new Error("No mintToAddress provided");
      }
      if (!wallet) {
        throw new Error("No wallet connected");
      }

      console.log("Figuring out if " + ensAddress + " is in the registry");

      try {
        const isRegistered = await getMetaAddress({ address: ensAddress });
        debugger

        return isRegistered;
      } catch (err: any) {
        console.log("Registry check error:", err.response?.data || err.message);
        toast.error("Failed to check registry status");
      }
    },
    enabled: !!ensAddress && !!wallet,
    staleTime: Infinity
  });

  useEffect(() => {
    if (!isInRegistry && !!stealthAddressInfo) {
      setMetaAddy(false)
    }
  }, [isInRegistry, stealthAddressInfo, setMetaAddy]);

  console.log("isInRegistry", isInRegistry, ensAddress);

  const announceStealthAddressMint = async (stealthAddress: string, ephemeralPubKey: string, metadata: string) => {
      await writeContract({
        abi: Contract5564,
        address: ANNOUNCE_CONTRACT_ADDRESS,
        functionName: "announce",
        args: [schemaId, stealthAddress, ephemeralPubKey, metadata],
      })
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const reciever = mintToAddress;
    const mintToWallet = reciever;

    if (!mintToWallet?.trim()) {
      alert("Please enter an ENS or Ethereum address");
      return;
    }

    setMinting(true);
    setMintResponse(null);

    try {
      const isEns = mintToWallet.includes(".eth");
      const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(mintToWallet.trim());
      const isEnsOrAddress = isEns || isEthAddress;

      console.log("Input validation:", {
        input: mintToWallet.trim(),
        isEns,
        isEthAddress,
        isEnsOrAddress,
      });

      let targetAddress = null;

      if (isEnsOrAddress) {
        if (isEns) {
          const profileResponse = await axios.get(
            `/api/poap/profile?ens=${mintToWallet.trim()}`
          );

          if (profileResponse.status !== 200) {
            throw new Error("Invalid ENS domain or ENS not found");
          }

          const profileData = profileResponse.data;
          targetAddress = profileData.address;

          if (!targetAddress) {
            throw new Error("No address found for the provided ENS");
          }
        } else {
          console.log(mintToAddress);
          targetAddress = mintToAddress;
        }

        if (stealthAddressInfo) {
          await announceStealthAddressMint(stealthAddressInfo.stealthAddress, stealthAddressInfo.ephemeralPubKey, stealthAddressInfo.metadata);
          generateStealthAddress();
        } else {
          throw new Error("No stealth address info provided. Please generate an anon address first.");
        }
        alert("Minted successfully!");
      } else {
        throw new Error("Please use an ENS domain or Ethereum address.");
      }
    } catch (error: any) {
      console.error("Error minting POAP:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setMinting(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="mint-form">
            <input
              type="text"
              placeholder="ENS or Ethereum address"
              value={ens}
              onChange={(e) => setEns(e.target.value)}
              className="address-input"
            />

            
            {isInRegistry ? <>
              <p className="claim-page__all-good">
                Your meta-stealth address is set up. You are all good to go!
              </p>
            </> : ' '}

            {
              !isInRegistry && (
                <>
                  <p className="claim-page__not-registered">Your meta-stealth address is not set up. Let's set it up</p>

                  <button className="mint-button claim-page__register-button" onClick={() => generateStealthAddress()}>Sound great</button>
                </>
              )
            }

            <button
              type="submit"
              className="mint-button"
              disabled={minting || !mintToAddress}
            >
              {minting ? "Minting..." : "Mint now"}
            </button>
          </form>
        </div>
      </div>

      {mintResponse && (
        <MintResponse mintResponse={mintResponse} />
      )}
    </>
  );
}

export default PoapClaim;
