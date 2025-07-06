import { useConnectWallet } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

export const PoapClaimBroadcast = ({
    startAnnounce,
}: {
    startAnnounce: () => Promise<void>;
}) => {
    const [isConnected, setIsConnected] = useState(false);

    const { connectWallet } = useConnectWallet({
        onSuccess: () => {
            setIsConnected(true);
        },
        onError: () => {
            setIsConnected(false);
        }
    });

    useEffect(() => {
        if (isConnected) {
            startAnnounce();
        }
    }, [isConnected]);

    return (
        <div>
            <p style={{ display: "flex", alignItems: "center", gap: "10px", flexFlow: "column nowrap" }}>
                [DEMO ONLY]

                {
                    !isConnected && (
                        <button className="mint-button" onClick={() => connectWallet()}>
                            Connect Wallet
                        </button>
                    )
                }

                {
                    isConnected && (
                        <button className="mint-button" onClick={() => startAnnounce()}>
                            Anounce mint
                        </button>
                    )
                }
            </p>
        </div>
    )
}