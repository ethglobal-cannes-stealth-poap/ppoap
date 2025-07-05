import { useRouter } from 'next/router'
import Layout from '../../components/layout'
import PoapClaim from '../../components/PoapClaim';
import { useState } from 'react';
import AnonAddress from '../../components/AnonAddress';

export default function Page() {
  const router = useRouter()
  const { id } = router.query;

  const [mintToAddress, setMintToAddress] = useState("");

  if (!id) {
    return <p>Loading...</p>
  }

  return (
    <Layout >
      <AnonAddress mintToAddress={mintToAddress} setMintToAddress={setMintToAddress} />
      <PoapClaim poapId={id as string} mintToAddress={mintToAddress} setMintToAddress={setMintToAddress} />
    </Layout>
  )
}