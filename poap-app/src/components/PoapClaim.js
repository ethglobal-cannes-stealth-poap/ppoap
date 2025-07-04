import React, { useState, useEffect } from "react";

function PoapClaim() {
  const [email, setEmail] = useState("");
  const [poapData, setPoapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minting, setMinting] = useState(false);
  const [mintResponse, setMintResponse] = useState(null);

  // Extract claim name from URL
  const getClaimName = () => {
    const urlParams = new URLSearchParams(window.location.search);
    // Check for claim parameter
    const claimName =
      urlParams.get("claim") || urlParams.get("name") || urlParams.get("code");

    // If no parameter, check if the claim name is in the URL path
    const pathMatch = window.location.pathname.match(/\/([a-zA-Z0-9-]+)$/);
    if (!claimName && pathMatch) {
      return pathMatch[1];
    }

    return claimName; // No default - must be provided
  };

  const fetchPoapData = async (claimName) => {
    try {
      setLoading(true);
      // Use the collectors POAP API validate endpoint to get metadata
      const response = await fetch(`/api/collectors/api/website/${claimName}/validate`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Invalid claim name: ${claimName}`);
      }

      const data = await response.json();
      console.log(
        "POAP Collectors API Response:",
        JSON.stringify(data, null, 2)
      );

      // The response should have event data
      if (!data) {
        throw new Error("No data found in response");
      }

      // Transform the response to match our expected format
      const transformedData = {
        id: data.id || data.event?.id,
        name: data.name || data.event?.name || "POAP Event",
        description: data.description || data.event?.description || "",
        image_url: data.image_url || data.image || data.event?.image_url, // This should be the POAP image
        start_date: data.start_date || data.event?.start_date,
        end_date: data.end_date || data.event?.end_date,
        claim_name: claimName,
        event: data.event || data,
        ...data,
      };

      console.log("Event image URL:", transformedData.image_url);
      setPoapData(transformedData);
    } catch (err) {
      setError(err.message);
      setPoapData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const claimName = getClaimName();
    if (claimName) {
      fetchPoapData(claimName);
    } else {
      setError("No claim name provided");
      setLoading(false);
    }
  }, []);

  const performMint = async (address, claimName) => {
    const mintResponse = await fetch(`/api/poap/website/claim`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': process.env.REACT_APP_POAP_API_KEY || ''
      },
      body: JSON.stringify({
        website: claimName,
        address: address
      })
    });

    console.log("Mint API response status:", mintResponse.status);

    if (!mintResponse.ok) {
      const errorText = await mintResponse.text();
      console.log("Mint API error response:", errorText);
      throw new Error(`Mint failed (${mintResponse.status}): ${errorText}`);
    }

    const responseData = await mintResponse.json();
    console.log("Mint API success response:", JSON.stringify(responseData, null, 2));
    return responseData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      alert("Please enter an email, ENS or Ethereum address");
      return;
    }

    setMinting(true);
    setMintResponse(null);

    try {
      // Check if the input looks like an ENS domain or Ethereum address
      const isEns = email.includes('.eth');
      const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(email.trim());
      const isEnsOrAddress = isEns || isEthAddress;
      
      console.log("Input validation:", {
        input: email.trim(),
        isEns,
        isEthAddress,
        isEnsOrAddress
      });
      
      let targetAddress = null;
      
      if (isEnsOrAddress) {
        if (isEns) {
          // For ENS domains, resolve to address using POAP profiles API
          const profileResponse = await fetch(`/api/profiles/profile/${email.trim()}`);
          
          if (!profileResponse.ok) {
            throw new Error("Invalid ENS domain or ENS not found");
          }
          
          const profileData = await profileResponse.json();
          console.log("ENS validation response:", profileData);
          
          targetAddress = profileData.address;
          
          if (!targetAddress) {
            throw new Error("No address found for the provided ENS");
          }
        } else {
          // For Ethereum addresses, use directly
          targetAddress = email.trim();
        }
        
        // Perform the actual mint
        const claimName = getClaimName();
        console.log("Minting POAP:", { 
          address: targetAddress, 
          claimName,
          hasApiKey: !!process.env.REACT_APP_POAP_API_KEY
        });
        
        const mintResult = await performMint(targetAddress, claimName);
        console.log("Final mint result:", JSON.stringify(mintResult, null, 2));
        
        setMintResponse(mintResult);
      } else {
        throw new Error("Email minting not supported yet. Please use an ENS domain or Ethereum address.");
      }
      
    } catch (error) {
      console.error("Error minting POAP:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading POAP...</p>
      </div>
    );
  }

  if (error || !poapData) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <h2>POAP Not Found</h2>
        <p>{error || "Unable to load POAP data"}</p>
        {getClaimName() && (
          <p className="error-details">Claim Name: {getClaimName()}</p>
        )}
        <p className="how-to">
          Please provide a claim name in the URL: ?claim=your-claim-name
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const extractNameFromTitle = (title) => {
    // Extract name from title like "You've met Skas at EthCC [8]"
    const match = title.match(/met\s+(\w+)\s+at/i);
    return match ? match[1].toUpperCase() : "FRIEND";
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
                    poapData?.image_url ||
                    poapData?.image ||
                    "https://via.placeholder.com/150x150?text=POAP"
                  }
                  alt={poapData?.name || "POAP"}
                  className="avatar-image"
                  onError={(e) => {
                    console.log("Image failed to load:", e.target.src);
                    e.target.src =
                      "https://via.placeholder.com/150x150?text=POAP";
                  }}
                />
                <div className="avatar-badge">
                  POAP
                  <br />#{poapData?.id}
                </div>
              </div>
            </div>
            <div className="name-text">
              {extractNameFromTitle(
                poapData?.name || poapData?.description || ""
              )}
            </div>
          </div>

          <div className="attendance-count left">#{poapData?.id}</div>
          <div className="attendance-count right">POAP</div>
        </div>
      </div>

      <div className="main-content">
        <h1>{poapData?.name || poapData?.description || "POAP Event"}</h1>
        <div className="date-info">
          📅{" "}
          {poapData?.start_date ? formatDate(poapData.start_date) : "Date TBD"}
          {poapData?.end_date && poapData.end_date !== poapData.start_date
            ? ` - ${formatDate(poapData.end_date)}`
            : ""}
        </div>

        <div className="collect-section">
          <h2>Collect this POAP</h2>
          <form onSubmit={handleSubmit} className="mint-form">
            <input
              type="text"
              placeholder="Email, ENS or Ethereum address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="email-input"
            />
            <button type="submit" className="mint-button" disabled={minting}>
              {minting ? "Minting..." : "Mint now"}
            </button>
          </form>

          <div className="mint-info">
            <div className="gnosis-info">Mint for free on 🟢 Gnosis</div>
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

      <footer className="footer">
        <div className="poap-logo">POAP</div>
        <div className="copyright">© 2025 POAP Inc.</div>
        <div className="footer-links">
          <a href="#" className="footer-link">
            Terms of Service
          </a>
          <span className="divider">|</span>
          <a href="#" className="footer-link">
            Privacy
          </a>
          <span className="divider">|</span>
          <a href="#" className="footer-link">
            Data Policy
          </a>
        </div>
      </footer>
    </>
  );
}

export default PoapClaim;
