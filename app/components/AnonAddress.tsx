import { useMutation } from "@tanstack/react-query";
import { initializeStealthAddress } from "../utils/pass-keys";
import toast from "react-hot-toast";
import { useWallets } from "@privy-io/react-auth";
import { generateStealthAddress } from "../utils/stealth-address";

interface AnonAddressProps {
  mintToAddress?: string;
  setMintToAddress: (address: string) => void;
}

function AnonAddress({ mintToAddress, setMintToAddress }: AnonAddressProps) {
  const { wallets } = useWallets();
  const wallet = wallets[0];

  const { mutate: generateStealthAddy, isPending: isGeneratingStealthAddress } = useMutation({
    mutationFn: async () => {
      console.log("Generating stealth address...");
      const data = await initializeStealthAddress() as any

      const stealthAddress = await generateStealthAddress(data.stealthMetaAddress)

      setMintToAddress(stealthAddress.stealthAddress);
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
