import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface MintResponse {
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
  mintResponse: MintResponse;
}

function MintResponse({ mintResponse }: PoapClaimProps) {
  return (
    <>
      <div className="mint-success">
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h3>POAP Minted Successfully!</h3>
        </div>
        <div className="success-details">
          <p>
            <strong>Mint ID:</strong> {mintResponse.id}
          </p>
          <p>
            <strong>Beneficiary:</strong> {mintResponse.beneficiary}
          </p>
          <p>
            <strong>Event:</strong> {mintResponse.event?.name}
          </p>
          <p>
            <strong>Claimed:</strong> {mintResponse.claimed ? "Yes" : "No"}
          </p>
          {mintResponse.claimed_date && (
            <p>
              <strong>Claimed Date:</strong>{" "}
              {new Date(mintResponse.claimed_date).toLocaleString()}
            </p>
          )}
          {mintResponse.qr_hash && (
            <p>
              <strong>QR Hash:</strong> {mintResponse.qr_hash}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default MintResponse;
