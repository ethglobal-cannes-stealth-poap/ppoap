import { useRouter } from 'next/router'
import Layout from '../../components/layout'
import PoapClaim from '../../components/PoapClaim';

export default function Page() {
  const router = useRouter()
  const { id } = router.query;

  if (!id) {
    return <p>Loading...</p>
  }

  return (
    <Layout >
      <PoapClaim poapId={id as string} />
    </Layout>
  )
}