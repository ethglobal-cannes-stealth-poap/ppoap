import { useRouter } from 'next/router'
import Layout from '../../components/layout'
import PoapClaim from '../../components/PoapClaim';
import { useState } from 'react';
import { initializeStealthAddress } from "../../utils/pass-keys";
import toast from "react-hot-toast";
import { generateStealthAddress } from "../../utils/stealth-address";
import { useMutation } from "@tanstack/react-query";

export default function Page() {
  const router = useRouter()
  const { id } = router.query;

  const [stealthAddressInfo, setStealthAddressInfo] = useState<{
    stealthAddress: string;
    ephemeralPubKey: string;
    metadata: string;
  } | null>(null);

  const [metaAddressInfo, setMetaAddressInfo] = useState<{
    stealthMetaAddress: string;
    spendingPrivateKey: string;
    viewingPrivateKey: string;
    spendingPublicKey: string;
    viewingPublicKey: string;
    viewTag: string;
    credentialUsed: string;
  } | null>(null);

  const mintToAddress = stealthAddressInfo?.stealthAddress;

  const { mutate: generateStealthAddy, isPending: isGeneratingStealthAddress } = useMutation({
    mutationFn: async () => {
      debugger
      console.log("Generating stealth address...");
      const data = await initializeStealthAddress()

      const stealthAddress = await generateStealthAddress(data.stealthMetaAddress)

      setStealthAddressInfo({
        stealthAddress: stealthAddress.stealthAddress,
        ephemeralPubKey: stealthAddress.ephemeralPublicKey,
        metadata: stealthAddress.ViewTag,
      });
      setMetaAddressInfo(data)
      toast.success("Anon address generated successfully!");
    }
  });

  if (!id) {
    return <p>Loading...</p>
  }

  return (
    <Layout >
      <PoapClaim poapId={id as string} mintToAddress={mintToAddress} stealthAddressInfo={stealthAddressInfo} metaAddressInfo={metaAddressInfo} generateStealthAddress={generateStealthAddy} />
    </Layout>
  )
}