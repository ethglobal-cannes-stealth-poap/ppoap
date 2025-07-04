import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/layout";

export default function HomePage() {
  const [mintingName, setMintingName] = useState("");

  return (
    <>
      <Head>
        <title>POAPrivacy</title>
      </Head>

      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6">
            Welcome to POAPrivacy
          </h1>
          
          <div className="w-full max-w-md space-y-6">
            <input
              type="text"
              placeholder="Enter your minting name"
              value={mintingName}
              onChange={(e) => setMintingName(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            
            {mintingName.trim() && (
              <Link href={`/claim/${encodeURIComponent(mintingName.trim())}`}>
                <button className="w-full bg-orange-500 hover:bg-orange-600 py-3 px-6 text-white text-lg rounded-lg transition-colors mt-6">
                  Go to Minting Page
                </button>
              </Link>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
