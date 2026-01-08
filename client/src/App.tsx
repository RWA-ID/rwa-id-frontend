import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, projectId, networks, metadata } from "./lib/wagmi-config";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Console from "@/pages/console";
import Claim from "@/pages/claim";
import Privacy from "@/pages/privacy";

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    defaultNetwork: networks[0],
    metadata,
    features: {
      analytics: false,
      socials: ["google", "x", "discord", "farcaster"],
      email: true,
      swaps: false,
      onramp: false,
    },
    themeMode: "light",
    featuredWalletIds: [
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    ],
    enableWalletConnect: true,
    enableInjected: true,
    enableEIP6963: true,
    allowUnsupportedChain: false,
    enableNetworkSwitch: false,
  });
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/console" component={Console} />
      <Route path="/claim" component={Claim} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
