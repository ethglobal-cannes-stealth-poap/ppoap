import { useMemo } from "react";
import { isAddress } from "viem";

import { useConnectWallet, useWallets } from "@privy-io/react-auth";
import { UseMutateFunction } from "@tanstack/react-query";

interface PoapClaimFullFormProps {
  ens: string;
  setEns: (ens: string) => void;
  isInRegistry: boolean;
  generateStealthAddressMutation: any;
  resolvedStealthMetaAddress: string;
  resolvedStealthAddressInfo: any;
  mintPoapMutation: any;
  setUpPasskeys: UseMutateFunction<void, Error, void, unknown>
}

export const PoapClaimFullForm = ({
    ens,
    setEns,
    isInRegistry,
    generateStealthAddressMutation,
    resolvedStealthMetaAddress,
    resolvedStealthAddressInfo,
    mintPoapMutation,
    setUpPasskeys,
}: PoapClaimFullFormProps) => {
  const { connectWallet } = useConnectWallet();
  const { wallets } = useWallets();
  const address = wallets?.[0]?.address;


  const isValidInput = useMemo(() => {
      return isAddress(ens) || ens.endsWith('.eth');
  }, [ens])

  return (
    <div className="mint-form">
      <input
        type="text"
        placeholder="ENS or Ethereum address"
        value={ens}
        onChange={(e) => setEns(e.target.value)}
        className="address-input"
      />


        {isInRegistry && isValidInput ? <>
          <p className="claim-page__all-good">
            Your meta-stealth address is set up. You are all good to go!
          </p>
        </> : ' '}

        {
          !isInRegistry && isValidInput && (
            <>
              <p className="claim-page__not-registered">Your meta-stealth address is not set up.</p>

            {!address ? (
              <button
                className="mint-button"
                onClick={() => connectWallet()}
              >
                Connect Wallet
              </button>
            ) : (
              <button
                className="mint-button"
                onClick={() => setUpPasskeys()}
              >
                Set up stealth account
              </button>
            )}
          </>
        )
      }

        {
          isInRegistry && isValidInput && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Generated stealth address"
                  disabled={true}
                  value={resolvedStealthAddressInfo?.stealthAddress}
                  className="address-input"
                />

                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => generateStealthAddressMutation.mutate(resolvedStealthMetaAddress as string)}
                >
                  🔄
                </div>

              </div>

              <button
                type="submit"
                className="mint-button"
                onClick={() => mintPoapMutation.mutate(resolvedStealthAddressInfo?.stealthAddress as string)}
                disabled={mintPoapMutation.isPending || !resolvedStealthAddressInfo?.stealthAddress || !isInRegistry}
              >
                {mintPoapMutation.isPending ? "Minting..." : "Mint now"}
              </button>
          </>
        )
      }
    </div >
  )
}