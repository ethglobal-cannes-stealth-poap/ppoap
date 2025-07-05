import { useLogin } from "@privy-io/react-auth";
import Head from "next/head";

export default function LoginPage() {
  const { login } = useLogin();

  return (
    <>
      <Head>
        <title>PPOAP</title>
      </Head>

      <main className="flex min-h-screen min-w-full">
        <div className="flex bg-green-200 flex-1 p-6 justify-center items-center">
          <div>
            <div className="mt-6 flex justify-center text-center">
              <button
                className="bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg"
                onClick={login}
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
