import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from '@privy-io/wagmi';
import { configFront } from "../lib/wallet";

const queryClient = new QueryClient()

function MyApp({ Component, pageProps }: AppProps) {

  useEffect(() => {
    window.Buffer = Buffer;
  }, []);

  return (
    <>
      <Head>
        <link
          rel="preload"
          href="/fonts/AdelleSans-Regular.woff"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/AdelleSans-Regular.woff2"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/AdelleSans-Semibold.woff"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/AdelleSans-Semibold.woff2"
          as="font"
          crossOrigin=""
        />

        <link rel="icon" href="/favicons/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png" />
        <link rel="manifest" href="/favicons/manifest.json" />

        <title>Privy Auth Starter</title>
        <meta name="description" content="Privy Auth Starter" />
      </Head>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        config={{
          appearance: {
            walletChainType: 'ethereum-only',
            walletList: ['metamask', 'rainbow', 'wallet_connect'],
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={configFront}>

            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  maxWidth: 350,
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#2c3e50',
                  border: '1px solid rgba(124, 77, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 4px 20px rgba(124, 77, 255, 0.2)',
                  lineHeight: '1.4'
                },
                success: {
                  style: {
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    color: 'white',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)'
                  },
                  iconTheme: {
                    primary: 'white',
                    secondary: '#4caf50'
                  }
                },
                error: {
                  style: {
                    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                    color: 'white',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    boxShadow: '0 4px 20px rgba(244, 67, 54, 0.3)'
                  },
                  iconTheme: {
                    primary: 'white',
                    secondary: '#f44336'
                  }
                },
                loading: {
                  style: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                  },
                  iconTheme: {
                    primary: 'white',
                    secondary: '#667eea'
                  }
                },
                duration: 4000
              }}
            />
            <Component {...pageProps} />
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </>
  );
}

export default MyApp;
