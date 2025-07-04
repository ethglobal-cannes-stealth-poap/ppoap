'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function Providers({ children }) {
  return (
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID}
      // clientId={process.env.REACT_APP_PRIVY_APP_SECRET}
      config={{
        appearance: {
          walletChainType: 'ethereum',
          walletList: ['metamask', 'rainbow', 'wallet_connect'],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}