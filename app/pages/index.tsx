import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/layout";
import Image from "next/image";

export default function HomePage() {
  const [mintingName, setMintingName] = useState("");

  return (
    <>
      <Head>
        <title>POAPrivacy</title>
      </Head>

      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 -mt-16">
          <Image
            src="/favicons/favicon.png"
            alt="POAPrivacy Logo"
            width={180}
            height={180}
            className="mb-6"
          />
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6">
            Welcome to POAPrivacy
          </h1>

          <div className="w-full max-w-md space-y-6">
            <input
              type="text"
              placeholder="Enter your minting name"
              value={mintingName}
              onChange={(e) => setMintingName(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
            />

            {mintingName.trim() && (
              <Link href={`/claim/${encodeURIComponent(mintingName.trim())}`}>
                <button className="w-full bg-cyan-400 hover:bg-cyan-500 py-3 px-6 text-white text-lg rounded-lg transition-colors mt-6">
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
