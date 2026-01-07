import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { linea } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { projectId } from "@/lib/wagmi-config";

export function WalletButton() {
  const { address, isConnected, chain, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chain?.id !== linea.id;

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
        onClick={() => switchChain({ chainId: linea.id })}
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
          // @ts-expect-error - appkit-account-button is a web component
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
      // @ts-expect-error - appkit-button is a web component
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
