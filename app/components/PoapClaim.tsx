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
import Contract5564 from "../constants/abi/5564.json";
import { authenticateAndGenerateStealthAddress } from "../utils/pass-keys";
import { mintingContent } from "./content";
import { performMint } from "../utils/minting";

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
  poapId: string;
  mintToAddress?: string;
  stealthAddressInfo?: {
    stealthAddress: string;
    ephemeralPubKey: string;
    metadata: string;
  } | null;
  metaAddressInfo?: {
    stealthMetaAddress: string;
    spendingPrivateKey: string;
    viewingPrivateKey: string;
    spendingPublicKey: string;
    viewingPublicKey: string;
    viewTag: string;
    credentialUsed: string;
  } | null;

  generateStealthAddress: (stealthMetaAddress: string) => void;
}

function PoapClaim({
  poapId,
  mintToAddress,
  stealthAddressInfo,
  metaAddressInfo,
  generateStealthAddress,
}: PoapClaimProps) {
  const [input, setInput] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintResponse, setMintResponse] = useState<MintResponse | null>(null);
  const { writeContract } = useWriteContract();

  const { data: ensAddress } = useEnsAddress({
    name: input.trim(),
    chainId: 1,
    query: {
      enabled:
        !!input.endsWith(".eth") && !!input.trim() && input.trim() !== "",
    },
  });

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
        if (!metaAddressInfo?.stealthMetaAddress) {
          throw new Error("No stealth meta address provided");
        }

        // if (isInRegistry === false) {
        //   toast.error(
        //     "This address is not registered in the Meta registry. Please register it first."
        //   );
        //   const res = await setMetaAddress({
        //     wallet,
        //     stealthMetaAddress: metaAddressInfo?.stealthMetaAddress,
        //   });
        //   console.log("Meta address set successfully:", res);
        // }

        toast.success("Meta address registered successfully!");
      } catch (err: any) {
        console.error("Error setting meta address:", err);
        toast.error(`Failed to register meta address: ${err.message}`);
      }
    },
  });

  const { data: isInRegistry = false, isLoading: isCheckingRegistry } =
    useQuery({
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
          debugger;

          return isRegistered;
        } catch (err: any) {
          console.log(
            "Registry check error:",
            err.response?.data || err.message
          );
          toast.error("Failed to check registry status");
        }
      },
      enabled: !!ensAddress && !!wallet,
      staleTime: Infinity,
    });

  useEffect(() => {
    if (!isInRegistry && !!stealthAddressInfo) {
      setMetaAddy(false);
    }
  }, [isInRegistry, stealthAddressInfo, setMetaAddy]);

  console.log("isInRegistry", isInRegistry, ensAddress);

  const announceStealthAddressMint = async (
    stealthAddress: string,
    ephemeralPubKey: string,
    metadata: string
  ) => {
    await writeContract({
      abi: Contract5564,
      address: ANNOUNCE_CONTRACT_ADDRESS,
      functionName: "announce",
      args: [schemaId, stealthAddress, ephemeralPubKey, metadata],
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userInput = input.trim();

    if (!userInput) {
      alert("Please enter an ENS or Ethereum address");
      return;
    }

    setMinting(true);
    setMintResponse(null);

    try {
      const isEns = userInput.includes(".eth");
      const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(userInput);
      const isEnsOrAddress = isEns || isEthAddress;

      console.log("Input validation:", {
        input: userInput,
        isEns,
        isEthAddress,
        isEnsOrAddress,
      });

      let targetAddress = null;

      if (isEnsOrAddress) {
        if (isEns) {
          const profileResponse = await axios.get(
            `/api/poap/profile?ens=${userInput}`
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
          // Use the user's input directly for Ethereum addresses
          targetAddress = userInput;
        }

        // Mint to the target address
        const mintResult = await performMint(poapId, targetAddress);
        setMintResponse(mintResult);
        alert("Minted successfully!");
        return;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  console.log("metaAddressInfo", metaAddressInfo);

  return (
    <>
      {mintingContent(poap, isLoadingPoap, poapId)}
      <div className="main-content">
        <h1>{poap?.name || poap?.description || "POAP Event"}</h1>
        <div className="date-info">
          📅 {poap?.start_date ? formatDate(poap.start_date) : "Date TBD"}
          {poap?.end_date && poap.end_date !== poap.start_date
            ? ` - ${formatDate(poap.end_date)}`
            : ""}
        </div>

        <div className="collect-section">
          <div
            className="wallet-status"
            style={{
              marginBottom: "16px",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {wallet ? (
              <span
                style={{
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🟢 Wallet Connected: {wallet.address.slice(0, 6)}...
                {wallet.address.slice(-4)}
              </span>
            ) : (
              <span
                style={{
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🔴 No Wallet Connected
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mint-form">
            <input
              type="text"
              placeholder="ENS or Ethereum address"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="address-input"
            />

            {/* {isInRegistry ? (
              <>
                <p className="claim-page__all-good">
                  Your meta-stealth address is set up. You are all good to go!
                </p>
              </>
            ) : (
              " "
            )} */}

            {/* {!isInRegistry && (
              <>
                <p className="claim-page__not-registered">
                  Your meta-stealth address is not set up. Let's set it up
                </p>

                <button
                  className="mint-button claim-page__register-button"
                  onClick={() =>
                    generateStealthAddress(
                      metaAddressInfo?.stealthMetaAddress || ""
                    )
                  }
                >
                  Sound great
                </button>
              </>
            )} */}

            <button
              type="submit"
              className="mint-button"
              disabled={minting || !input.trim()}
            >
              {minting ? "Minting..." : "Mint now"}
            </button>
          </form>
        </div>
      </div>

      {mintResponse && <MintResponse mintResponse={mintResponse} />}
    </>
  );
}

export default PoapClaim;
