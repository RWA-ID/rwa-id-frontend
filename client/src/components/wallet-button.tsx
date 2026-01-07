import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { linea } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertTriangle, Loader2 } from "lucide-react";

export function WalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chain?.id !== linea.id;

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isPending) {
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
      </div>
    );
  }

  return (
    <Button
      onClick={() => {
        const injectedConnector = connectors.find(c => c.id === "injected");
        if (injectedConnector) {
          connect({ connector: injectedConnector });
        }
      }}
      className="min-w-[160px]"
      data-testid="button-connect-wallet"
    >
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
