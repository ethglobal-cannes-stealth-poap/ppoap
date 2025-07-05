# ppoap

**Privacy POAPs powered by EIP-6538**

Now you can mint POAPs without disclosing your location or personal information.

## 🔐 Overview

ppoap is a privacy-focused POAP (Proof of Attendance Protocol) minting application that leverages EIP-6538 to enable anonymous attendance verification. Users can mint POAPs while maintaining their privacy and without revealing their physical location.

## ✨ Features

- **Private Minting**: Mint POAPs without revealing your location
- **EIP-6538 Integration**: Built on the latest privacy standards
- **Wallet Integration**: Connect with popular Web3 wallets
- **Real-time Validation**: Instant POAP validation and verification
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ppoap.git
cd ppoap
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your environment variables:
```env
POAP_API_KEY=your_poap_api_key_here
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, DaisyUI
- **Wallet**: Privy (Web3 wallet integration)
- **Privacy**: EIP-6538 implementation
- **API**: Next.js API routes
- **HTTP Client**: Axios

## 📁 Project Structure

```
ppoap/
├── app/
│   ├── pages/
│   │   ├── api/
│   │   │   └── poap/
│   │   │       ├── validate/
│   │   │       └── mint/
│   │   └── index.tsx
│   ├── components/
│   └── styles/
├── public/
└── README.md
```

## 🔧 API Endpoints

### Validate POAP
```
GET /api/poap/validate?poapId=your-poap-id
```

### Mint POAP
```
POST /api/poap/mint
Content-Type: application/json

{
  "website": "poap-claim-name",
  "address": "0x..."
}
```

## 🛡️ Privacy Features

- **Zero Location Disclosure**: Your physical location is never transmitted
- **EIP-6538 Compliance**: Built on privacy-first standards
- **Minimal Data Collection**: Only essential information is processed
- **Secure Validation**: Cryptographic proof without personal data exposure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [POAP Protocol](https://poap.xyz/)
- [EIP-6538 Specification](https://eips.ethereum.org/EIPS/eip-6538)
- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Documentation](https://docs.privy.io/)

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/ppoap/issues) page
2. Create a new issue with detailed information
3. Join our [Discord](https://discord.gg/your-discord) for community support

---

**Built with ❤️ for the privacy-conscious Web3 community**# ppoap
Provacy POAPs
