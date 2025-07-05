import React, { useState, useEffect } from "react";
import { runDemo } from "../utils/pass-keys.js";

export const PassKey = () => {
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Check WebAuthn support on component mount
  useEffect(() => {
    if (!window.PublicKeyCredential) {
      setStatus(
        "❌ WebAuthn is not supported in this browser. Please use a modern browser with WebAuthn support."
      );
      setStatusType("error");
      setIsWebAuthnSupported(false);
    } else {
      setStatus(
        "ℹ️ WebAuthn is supported. Ready to generate EIP-5564 stealth meta-address!"
      );
      setStatusType("info");
      setIsWebAuthnSupported(true);
    }
  }, []);

  // Generate stealth address function
  const generateStealthAddress = async () => {
    try {
      setIsGenerating(true);
      setStatus("🔄 Starting EIP-5564 stealth meta-address generation...");
      setStatusType("info");
      setShowResults(false);

      // Run the demo
      const result = await runDemo();

      // Set results
      setResults(result);
      setShowResults(true);
      setStatus("✅ EIP-5564 stealth meta-address generated successfully!");
      setStatusType("success");
    } catch (error) {
      console.error("Generation failed:", error);
      setStatus(`❌ Generation failed: ${error.message}`);
      setStatusType("error");
      setShowResults(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔐 PPOAP Stealth Meta-Address Demo</h1>

      <div style={styles.intro}>
        <h3>🎯 EIP-5564 Stealth Address Generation</h3>
        <p>
          This demo generates a stealth meta-address using WebAuthn API and
          EIP-5564 specification:
        </p>
        <ul>
          <li>
            Creates a WebAuthn credential using{" "}
            <strong>ES256 (ECDSA P-256)</strong>
          </li>
          <li>
            Signs the static message <code>"cannes-love-poap"</code> for
            deterministic key derivation
          </li>
          <li>
            Derives spending and viewing keys using <strong>HKDF</strong> with
            EIP-5564 compliant salts
          </li>
          <li>Generates compressed public keys (33 bytes each)</li>
          <li>Creates view tag (1 byte) for efficient parsing</li>
          <li>
            Formats the stealth meta-address as:{" "}
            <code>st:eth:0x&lt;spendingPubKey&gt;&lt;viewingPubKey&gt;</code>
          </li>
        </ul>
      </div>

      <div style={styles.reference}>
        <strong>📚 Based on:</strong>{" "}
        <a
          href="https://github.com/nerolation/stealth-utils"
          target="_blank"
          rel="noopener noreferrer"
        >
          nerolation/stealth-utils
        </a>
        and{" "}
        <a
          href="https://eips.ethereum.org/EIPS/eip-5564"
          target="_blank"
          rel="noopener noreferrer"
        >
          EIP-5564 specification
        </a>
      </div>

      <div style={styles.warning}>
        <strong>⚠️ Requirements:</strong> This demo requires a
        WebAuthn-compatible browser and authenticator (biometric, security key,
        or platform authenticator). Modern browsers like Chrome, Firefox,
        Safari, and Edge support WebAuthn.
      </div>

      <div style={styles.demoSection}>
        <h3>🚀 Generate Stealth Meta-Address</h3>
        <p>
          Click the button below to start the WebAuthn credential creation and
          stealth address generation process.
        </p>

        <button
          style={{
            ...styles.button,
            ...(!isWebAuthnSupported || isGenerating
              ? styles.buttonDisabled
              : {}),
          }}
          onClick={generateStealthAddress}
          disabled={!isWebAuthnSupported || isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Stealth Meta-Address"}
        </button>

        {status && (
          <div
            style={{
              ...styles.status,
              ...styles[
              `status${statusType.charAt(0).toUpperCase() + statusType.slice(1)
              }`
              ],
            }}
          >
            {status}
          </div>
        )}

        {showResults && results && (
          <div style={styles.results}>
            <h4 style={styles.resultsTitle}>
              🎯 Generated EIP-5564 Stealth Meta-Address
            </h4>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>Stealth Meta-Address:</div>
              <div style={styles.resultValue}>{results.stealthMetaAddress}</div>
            </div>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>Spending Private Key:</div>
              <div style={styles.resultValue}>
                0x{results.spendingPrivateKey}
              </div>
            </div>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>Viewing Private Key:</div>
              <div style={styles.resultValue}>
                0x{results.viewingPrivateKey}
              </div>
            </div>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>Spending Public Key:</div>
              <div style={styles.resultValue}>{results.spendingPublicKey}</div>
            </div>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>Viewing Public Key:</div>
              <div style={styles.resultValue}>{results.viewingPublicKey}</div>
            </div>
            <div style={styles.resultItem}>
              <div style={styles.resultLabel}>View Tag:</div>
              <div style={styles.resultValue}>{results.viewTag}</div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.demoSection}>
        <h3>📖 How it works</h3>
        <ol>
          <li>
            <strong>WebAuthn Credential Creation:</strong> Creates a new passkey
            using ES256 algorithm
          </li>
          <li>
            <strong>Deterministic Signing:</strong> Signs the static message
            "cannes-love-poap" to get a deterministic signature
          </li>
          <li>
            <strong>Key Derivation:</strong> Uses HKDF with EIP-5564 compliant
            salts to derive spending and viewing keys
          </li>
          <li>
            <strong>Public Key Generation:</strong> Generates compressed public
            keys (33 bytes) from the derived private keys
          </li>
          <li>
            <strong>View Tag Generation:</strong> Creates a 1-byte view tag for
            efficient stealth address parsing
          </li>
          <li>
            <strong>Address Formatting:</strong> Concatenates the public keys
            with the EIP-5564 prefix
          </li>
        </ol>
      </div>

      <div style={styles.demoSection}>
        <h3>🌟 EIP-5564 Compliance</h3>
        <p>
          This implementation follows the EIP-5564 specification with the
          following features:
        </p>
        <ul>
          <li>
            ✅ <strong>Meta-address format:</strong>{" "}
            <code>st:eth:0x&lt;spending&gt;&lt;viewing&gt;</code>
          </li>
          <li>
            ✅ <strong>Compressed public keys:</strong> 33 bytes each with
            proper compression flags
          </li>
          <li>
            ✅ <strong>View tag:</strong> 1 byte for efficient parsing
          </li>
          <li>
            ✅ <strong>Deterministic derivation:</strong> Same passkey always
            generates same address
          </li>
          <li>
            ✅ <strong>HKDF key derivation:</strong> Using EIP-5564 compliant
            salts
          </li>
          <li>
            ⚠️ <strong>Curve limitation:</strong> Uses P-256 (WebAuthn
            constraint) instead of secp256k1
          </li>
        </ul>
      </div>

      <div style={styles.footer}>
        <p>Built with ❤️ for ETH Global 2025 - Cannes Edition</p>
        <p>
          Using WebAuthn API +{" "}
          <a
            href="https://eips.ethereum.org/EIPS/eip-5564"
            target="_blank"
            rel="noopener noreferrer"
          >
            EIP-5564
          </a>{" "}
          Stealth Address Specification
        </p>
        <p>
          Reference:{" "}
          <a
            href="https://nerolation.github.io/stealth-utils/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stealth Address Guide
          </a>{" "}
          by nerolation
        </p>
      </div>
    </div>
  );
};

// Styles object
const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    margin: 0,
    padding: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    minHeight: "100vh",
    color: "#333",
  },
  title: {
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "2.5em",
  },
  intro: {
    background: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "30px",
    borderLeft: "4px solid #3498db",
  },
  reference: {
    background: "#e8f4fd",
    color: "#0277bd",
    border: "1px solid #b3e5fc",
    padding: "15px",
    borderRadius: "8px",
    margin: "20px 0",
  },
  warning: {
    background: "#fff3cd",
    color: "#856404",
    border: "1px solid #ffeaa7",
    padding: "15px",
    borderRadius: "8px",
    margin: "20px 0",
  },
  demoSection: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #e9ecef",
  },
  button: {
    background: "linear-gradient(45deg, #3498db, #2ecc71)",
    color: "white",
    border: "none",
    padding: "15px 30px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    display: "block",
    margin: "20px auto",
    minWidth: "200px",
  },
  buttonDisabled: {
    background: "#bdc3c7",
    cursor: "not-allowed",
    transform: "none",
  },
  status: {
    padding: "15px",
    margin: "10px 0",
    borderRadius: "8px",
    fontWeight: "500",
  },
  statusInfo: {
    background: "#e3f2fd",
    color: "#1565c0",
    border: "1px solid #bbdefb",
  },
  statusSuccess: {
    background: "#e8f5e8",
    color: "#2e7d32",
    border: "1px solid #c8e6c9",
  },
  statusError: {
    background: "#ffebee",
    color: "#c62828",
    border: "1px solid #ffcdd2",
  },
  results: {
    background: "#1a1a1a",
    color: "#00ff00",
    padding: "20px",
    borderRadius: "8px",
    fontFamily: "'Courier New', monospace",
    fontSize: "12px",
    marginTop: "20px",
    wordBreak: "break-all",
  },
  resultsTitle: {
    color: "#00ff00",
    marginTop: 0,
  },
  resultItem: {
    margin: "10px 0",
    padding: "10px",
    background: "#2a2a2a",
    borderRadius: "4px",
  },
  resultLabel: {
    color: "#ffff00",
    fontWeight: "bold",
  },
  resultValue: {
    color: "#00ff00",
    wordBreak: "break-all",
  },
  footer: {
    textAlign: "center",
    marginTop: "30px",
    padding: "20px",
    borderTop: "1px solid #e9ecef",
    color: "#6c757d",
  },
};

export default PassKey;
