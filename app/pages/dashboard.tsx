import { usePrivy } from "@privy-io/react-auth";
import Head from "next/head";
import WalletList from "../components/WalletList";

export default function DashboardPage() {
  const {
    ready,
    authenticated,
    user,
    logout,
    linkWallet,
  } = usePrivy();

  return (
    <>
      <Head>
        <title>PPOAP</title>
      </Head>

      <main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
        {ready && authenticated ? (
          <>
            <div className="flex flex-row justify-between">
              <h1 className="text-2xl font-semibold">Privy Auth Demo</h1>
              <button
                onClick={logout}
                className="text-sm bg-violet-200 hover:text-violet-900 py-2 px-4 rounded-md text-violet-700"
              >
                Logout
              </button>
            </div>
            <div className="mt-12 flex gap-4 flex-wrap">
              <button
                onClick={linkWallet}
                className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white border-none"
              >
                Connect wallet
              </button>
            </div>
            <div className="space-y-6 max-w-4xl mt-6">
              <h2 className="text-xl font-bold">Your Wallet</h2>
              <WalletList />
            </div>
            <p className="mt-6 font-bold uppercase text-sm text-gray-600">
              User object
            </p>
            <pre className="max-w-4xl bg-slate-700 text-slate-50 font-mono p-4 text-xs sm:text-sm rounded-md mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </>
        ) : null}
      </main>
    </>
  );
}
