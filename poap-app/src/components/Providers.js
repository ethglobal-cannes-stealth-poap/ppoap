'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }) {
  return (
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID}
      config={{
        appearance: {
          walletChainType: 'ethereum',
          walletList: ['metamask', 'rainbow', 'wallet_connect'],
        },
      }}
    >
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
      {children}
    </PrivyProvider>
  );
}