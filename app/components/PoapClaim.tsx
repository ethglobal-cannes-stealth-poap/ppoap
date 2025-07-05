import { SyntheticEvent, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { initializeStealthAddress } from "../utils/pass-keys";
import { generateStealthAddress } from "../utils/stealth-address";

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

function PoapClaim({ poapId }: { poapId: string }) {
  const [minting, setMinting] = useState(false);
  const [mintResponse, setMintResponse] = useState<MintResponse | null>(null);

  const [getAnonAddress, setGetAnonAddress] = useState(false);

  const { data: stealthAddress } = useQuery({
    queryKey: ['stealth-address'],
    enabled: getAnonAddress,
    queryFn: async () => {
      const data = await initializeStealthAddress() as any

      const stealthAddress = await generateStealthAddress(data.stealthMetaAddress)
      return stealthAddress.stealthAddress
    }
  })

  const { data: poap, isLoading: isLoadingPoap } = useQuery({
    queryKey: ['poap', poapId],
    queryFn: async () => {
      if (!poapId) {
        throw new Error("No poapId provided");
      }

      try {
        const response = await axios.get(`/api/poap/validate?poapId=${poapId}`, {
          headers: {
            Accept: "application/json",
          },
        });

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
          throw new Error(`Invalid claim name: ${poapId} (${err.response.status})`);
        }
        throw new Error(err.message || `Failed to fetch POAP data for: ${poapId}`);
      }
    },
  })

  const performMint = async (address: string) => {
    try {
      const response = await axios.post('/api/poap/mint', {
        website: poapId,
        address: address
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log("Mint API success response:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (err: any) {
      console.log("Mint API error:", err.response?.data || err.message);
      throw new Error(`Mint failed (${err.response?.status || 'Network Error'}): ${err.response?.data?.error || err.message}`);
    }
  };

  const handleGetAnonAddress = async () => {
    setGetAnonAddress(true);
  }

  const handleSubmit = async (e: SyntheticEvent<HTMLImageElement, Event>) => {
    e.preventDefault();

    const reciever = stealthAddress

    const mintToWallet = reciever

    if (!mintToWallet?.trim()) {
      alert("Please enter an email, ENS or Ethereum address");
      return;
    }

    setMinting(true);
    setMintResponse(null);

    try {
      const isEns = mintToWallet.includes('.eth');
      const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(mintToWallet.trim());
      const isEnsOrAddress = isEns || isEthAddress;

      console.log("Input validation:", {
        input: mintToWallet.trim(),
        isEns,
        isEthAddress,
        isEnsOrAddress
      });

      let targetAddress = null;

      if (isEnsOrAddress) {
        if (isEns) {
          const profileResponse = await axios.get(`/api/poap/profile?ens=${mintToWallet.trim()}`);

          if (profileResponse.status !== 200) {
            throw new Error("Invalid ENS domain or ENS not found");
          }

          const profileData = profileResponse.data;
          console.log("ENS validation response:", profileData);

          targetAddress = profileData.address;

          if (!targetAddress) {
            throw new Error("No address found for the provided ENS");
          }
        } else {
          console.log(stealthAddress)
          targetAddress = stealthAddress;

        }

        console.log("Minting POAP:", {
          address: targetAddress,
          poapId
        });

        const mintResult = await performMint(targetAddress);
        console.log("Final mint result:", JSON.stringify(mintResult, null, 2));

        setMintResponse(mintResult);
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
        {poapId && (
          <p className="error-details">Claim Name: {poapId}</p>
        )}
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

  const extractNameFromTitle = (title: string) => {
    // Extract name from title like "You've met Skas at EthCC [8]"
    const match = title.match(/met\s+(\w+)\s+at/i);
    return match ? match[1]?.toUpperCase() : "FRIEND";
  };

  return (
    <>
      <div className="background-elements">
        <div className="star star-1">✦</div>
        <div className="star star-2">✦</div>
        <div className="cloud cloud-1">☁</div>
        <div className="spiral spiral-1">🌀</div>
      </div>

      <div className="poap-container">
        <div className="poap-circle">
          <div className="progress-ring"></div>

          <div className="poap-content">
            <div className="met-text">YOU'VE MET</div>
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
                <div className="avatar-badge">
                  POAP
                  <br />#{poap?.id}
                </div>
              </div>
            </div>
            <div className="name-text">
              {extractNameFromTitle(
                poap?.name || poap?.description || ""
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <h1>{poap?.name || poap?.description || "POAP Event"}</h1>
        <div className="date-info">
          📅{" "}
          {poap?.start_date ? formatDate(poap.start_date) : "Date TBD"}
          {poap?.end_date && poap.end_date !== poap.start_date
            ? ` - ${formatDate(poap.end_date)}`
            : ""}
        </div>

        <div className="collect-section">
          <h2>Collect this POAP</h2>
          <form onSubmit={handleSubmit} className="mint-form">

            <button type="button" className="mint-button" onClick={handleGetAnonAddress}>
              Get Anon Address
            </button>

            <input
              type="text"
              placeholder="Email, ENS or Ethereum address"
              value={stealthAddress}
              disabled={true}
              // onChange={(e) => setMintToWallet(e.target.value)}
              className="email-input"
            />
            <button type="submit" className="mint-button" disabled={minting}>
              {minting ? "Minting..." : "Mint now"}
            </button>
          </form>

          <div className="mint-info">
            <div className="terms">
              By minting this POAP, you accept POAP Inc's{" "}
              <a href="#" className="link">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="link">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      {mintResponse && (
        <div className="mint-success">
          <div className="success-header">
            <div className="success-icon">✅</div>
            <h3>POAP Minted Successfully!</h3>
          </div>
          <div className="success-details">
            <p><strong>Mint ID:</strong> {mintResponse.id}</p>
            <p><strong>Beneficiary:</strong> {mintResponse.beneficiary}</p>
            <p><strong>Event:</strong> {mintResponse.event?.name}</p>
            <p><strong>Claimed:</strong> {mintResponse.claimed ? 'Yes' : 'No'}</p>
            {mintResponse.claimed_date && (
              <p><strong>Claimed Date:</strong> {new Date(mintResponse.claimed_date).toLocaleString()}</p>
            )}
            {mintResponse.qr_hash && (
              <p><strong>QR Hash:</strong> {mintResponse.qr_hash}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default PoapClaim;
