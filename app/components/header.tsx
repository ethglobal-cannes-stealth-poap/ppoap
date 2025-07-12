import { usePrivy, useLogin, useLogout, useWallets } from '@privy-io/react-auth';
import { truncateAddress } from '../utils/format';
import Link from 'next/link';

export default function Header() {
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