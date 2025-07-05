import { useLogin } from "@privy-io/react-auth";
import Head from "next/head";
import Layout from "../components/layout";

export default function LoginPage() {
  const { login } = useLogin();

  return (
    <>
      <Head>
        <title>PPOAP</title>
      </Head>

      <Layout >
        <div className="mt-6 flex justify-center text-center">
          <button
            className="bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg"
            onClick={login}
          >
            Log in
          </button>
        </div>
      </Layout>
    </>
  );
}
