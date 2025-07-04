import { usePrivy, useLogin, useLogout, useWallets } from '@privy-io/react-auth';
import { truncateAddress } from '../utils/formt';

export default function Header() {
  const { login } = useLogin();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const { logout } = useLogout({
    onSuccess: () => {
      console.log('User successfully logged out');
    },
    onError: (error) => {
      console.error('Logout failed', error);
    }
  });

  const disableLogin = !ready || (ready && authenticated);

  return (
    <header className="header">
      <div className="header-title">
        PPOAP
      </div>

      {authenticated ? (
        <button className="wallet-connected" onClick={() => logout()} disabled={false}>
          <div className="wallet-indicator"></div>
          <span className="wallet-address">
            {truncateAddress(wallets[0].address)}
          </span>
        </button>
      ) : (
        <button
          className="connect-wallet-button"

          disabled={disableLogin}
          onClick={() => login({
            loginMethods: ['wallet'],
            walletChainType: 'ethereum-and-solana',
            disableSignup: false
          })}
        >
          Log in
        </button>
      )}
    </header>
  );
}