import React from "react";
import Header from "./header";
import Footer from "./footer";

type Props = {
  children: React.ReactNode;
};

export default function Layout({
  children,
}: Props) {
  // const { ready, authenticated } = usePrivy();
  // const router = useRouter();

  return (
    <div className="App">
      <div className="app-wrapper">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
