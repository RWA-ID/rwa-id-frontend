import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { projectId } from "@/lib/wagmi-config";
import { LINEA_CHAIN_ID } from "@/lib/abi";

export function WalletButton() {
  const { address, isConnected, chain, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chain?.id !== LINEA_CHAIN_ID;

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleFallbackConnect = () => {
    const injectedConnector = connectors.find(c => c.id === "injected");
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  if (isConnecting || isPending) {
    return (
      <Button disabled className="min-w-[160px]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (isWrongNetwork) {
    return (
      <Button
        onClick={() => switchChain({ chainId: LINEA_CHAIN_ID })}
        variant="destructive"
        disabled={isSwitching}
        className="min-w-[160px]"
        data-testid="button-switch-network"
      >
        {isSwitching ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <AlertTriangle className="mr-2 h-4 w-4" />
        )}
        Switch to Linea
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {projectId ? (
          <appkit-account-button data-testid="button-wallet-info" />
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted text-sm font-mono">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {truncateAddress(address)}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => disconnect()}
              data-testid="button-disconnect-wallet"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  }

  if (projectId) {
    return (
      <appkit-button data-testid="button-connect-wallet" />
    );
  }

  return (
    <Button
      onClick={handleFallbackConnect}
      className="min-w-[160px]"
      data-testid="button-connect-wallet"
    >
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
