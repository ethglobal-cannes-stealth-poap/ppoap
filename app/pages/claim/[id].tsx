import { useRouter } from 'next/router'
import Layout from '../../components/layout'
import PoapClaim from '../../components/PoapClaim';
import { useState } from 'react';
import { initializeStealthAddress } from "../../utils/pass-keys";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

export default function Page() {
  const router = useRouter()
  const { id } = router.query;

  const [metaAddressInfo, setMetaAddressInfo] = useState<{
    stealthMetaAddress: string;
    spendingPrivateKey: string;
    viewingPrivateKey: string;
    spendingPublicKey: string;
    viewingPublicKey: string;
    viewTag: string;
    credentialUsed: string;
  } | null>(null);

  const { mutate: setUpPasskeys } = useMutation({
    mutationFn: async () => {
      console.log("Generating stealth address...");
      const data = await initializeStealthAddress()
      setMetaAddressInfo(data)
    },
    onSuccess: () => {
      toast.success("Passkeys are ready.");
    }
  });

  if (!id) {
    return <p>Loading...</p>
  }

  return (
    <Layout >
      <PoapClaim poapId={id as string} setUpPasskeys={setUpPasskeys} metaAddressInfo={metaAddressInfo} />
    </Layout>
  )
}