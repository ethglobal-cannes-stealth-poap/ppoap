import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "./App.css";
import PoapClaim from "./components/PoapClaim";
import Providers from './components/Providers';
import Header from "./components/Header";
import { sepolia } from 'wagmi/chains';
import { WagmiProvider } from '@privy-io/wagmi';
import { config } from './lib/wallet';

const queryClient = new QueryClient()

function App() {
  return (
    <Providers
      config={{
        defaultChain: sepolia,
        supportedChains: [sepolia]
      }}

    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <div className="App">
            <div className="app-wrapper">
              <Header />
              <PoapClaim />
            </div>
          </div>
        </WagmiProvider>
      </QueryClientProvider >
    </Providers>
  );
}

export default App;
