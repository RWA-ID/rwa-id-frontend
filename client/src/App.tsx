import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./lib/wagmi-config";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Platform from "@/pages/platform";
import Claim from "@/pages/claim";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/platform" component={Platform} />
      <Route path="/claim" component={Claim} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
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
