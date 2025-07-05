import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "./App.css";
import PoapClaim from "./components/PoapClaim";
import Providers from './components/Providers';
import Header from "./components/Header";
import Footer from "./components/Footer";
import { sepolia } from 'wagmi/chains';
import { WagmiProvider } from '@privy-io/wagmi';
import { config } from './lib/wallet';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import { Buffer } from 'buffer';

window.Buffer = Buffer;

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
          <Router>
            <div className="App">
              <div className="app-wrapper">
                <Header />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/claim/:id" element={<PoapClaim />} />
                </Routes>
                <Footer />
              </div>
            </div>
          </Router>
        </WagmiProvider>
      </QueryClientProvider>
    </Providers>
  );
}

export default App;
