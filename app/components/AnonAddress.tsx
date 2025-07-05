import { useMutation } from "@tanstack/react-query";
import { initializeStealthAddress } from "../utils/pass-keys";
import toast from "react-hot-toast";
import { generateStealthAddress } from "../utils/stealth-address";

interface AnonAddressProps {
  mintToAddress?: string;
  setStealthAddressInfo: (info: {
    stealthAddress: string;
    ephemeralPubKey: string;
    metadata: string;
  }) => void;
  setMetaAddressInfo: (info: {
    stealthMetaAddress: string
    spendingPrivateKey: string
    viewingPrivateKey: string
    spendingPublicKey: string
    viewingPublicKey: string
    viewTag: string
    credentialUsed: string
  }) => void;
}

function AnonAddress({ mintToAddress, setStealthAddressInfo }: AnonAddressProps) {
  const { mutate: generateStealthAddy, isPending: isGeneratingStealthAddress } = useMutation({
    mutationFn: async () => {
      console.log("Generating stealth address...");
      const data = await initializeStealthAddress()

      const stealthAddress = await generateStealthAddress(data.stealthMetaAddress)

      setStealthAddressInfo({
        stealthAddress: stealthAddress.stealthAddress,
        ephemeralPubKey: stealthAddress.ephemeralPublicKey,
        metadata: stealthAddress.ViewTag,
      });
      toast.success("Anon address generated successfully!");
    }
  });

  return (
    <>
      <div>
        <button
          type="button"
          className="mint-button"
          disabled={isGeneratingStealthAddress}
          onClick={() => generateStealthAddy()}
        >
          {mintToAddress ? "Generate new address" : "Get Anon Address"}
        </button>
      </div>
    </>
  );
}

export default AnonAddress;
