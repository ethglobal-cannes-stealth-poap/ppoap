import { usePrivy, useLogin, useLogout, useWallets } from '@privy-io/react-auth';
import { truncateAddress } from '../utils/format';
import Link from 'next/link';

import Link from 'next/link';

export default function Header() {
  const { login } = useLogin();
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { logout } = useLogout();

  // Get the user's primary wallet address from Privy
  const address = user?.wallet?.address || '';
  const disableLogin = !ready || (ready && authenticated);

  return (
    <header className="header">
      <Link href="/" className="header-title">
        POAPrivacy
      </Link>
      <Link
        href="/me"
        className="header-nav-link"
      >
        My POAPs
      </Link>
    </header>
  );
}