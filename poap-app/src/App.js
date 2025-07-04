import React, { useState } from 'react';
import './App.css';

function App() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Minting POAP for:', email);
  };

  return (
    <div className="App">
      <div className="background-elements">
        <div className="star star-1">✦</div>
        <div className="star star-2">✦</div>
        <div className="cloud cloud-1">☁</div>
        <div className="spiral spiral-1">🌀</div>
      </div>
      
      <div className="poap-container">
        <div className="poap-circle">
          <div className="progress-ring">
            <div className="progress-segment segment-1"></div>
            <div className="progress-segment segment-2"></div>
            <div className="progress-segment segment-3"></div>
            <div className="progress-segment segment-4"></div>
            <div className="progress-segment segment-5"></div>
            <div className="progress-segment segment-6"></div>
          </div>
          
          <div className="poap-content">
            <div className="met-text">YOU'VE MET</div>
            <div className="avatar-container">
              <div className="avatar">
                <div className="avatar-character">🧑‍💻</div>
                <div className="avatar-badge">ATF<br/>AGENT</div>
              </div>
            </div>
            <div className="name-text">SKAS</div>
          </div>
          
          <div className="attendance-count left">2<br/>EthCCI</div>
          <div className="attendance-count right">25<br/>POAP</div>
        </div>
      </div>
      
      <div className="main-content">
        <h1>You've met Skas at EthCC [8]</h1>
        <div className="date-info">
          📅 Jun 28, 2025 - Jul 6, 2025
        </div>
        
        <div className="collect-section">
          <h2>Collect this POAP</h2>
          <form onSubmit={handleSubmit} className="mint-form">
            <input
              type="text"
              placeholder="Email, ENS or Ethereum address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="email-input"
            />
            <button type="submit" className="mint-button">
              Mint now
            </button>
          </form>
          
          <div className="mint-info">
            <div className="gnosis-info">
              Mint for free on 🟢 Gnosis
            </div>
            <div className="terms">
              By minting this POAP, you accept POAP Inc's{' '}
              <a href="#" className="link">Terms of Service</a> and{' '}
              <a href="#" className="link">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="footer">
        <div className="poap-logo">POAP</div>
        <div className="copyright">© 2025 POAP Inc.</div>
        <div className="footer-links">
          <a href="#" className="footer-link">Terms of Service</a>
          <span className="divider">|</span>
          <a href="#" className="footer-link">Privacy</a>
          <span className="divider">|</span>
          <a href="#" className="footer-link">Data Policy</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
