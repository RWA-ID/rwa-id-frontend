import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "./lib/wagmi-config";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Privacy from "@/pages/privacy";
import "@rainbow-me/rainbowkit/styles.css";

const DASHBOARD_URL = "https://dashboard.rwa-id.com";

/**
 * The console and the client claim flow used to live here. They now live in the
 * dashboard app, so these paths only exist to carry old links across — claim
 * links of the form /claim/:projectId/:cid were shared before the move.
 */
function RedirectToDashboard() {
  useEffect(() => {
    window.location.replace(DASHBOARD_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <p className="text-muted-foreground">
        This has moved to the{" "}
        <a href={DASHBOARD_URL} className="underline">
          RWA-ID dashboard
        </a>
        .
      </p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/console" component={RedirectToDashboard} />
      <Route path="/claim" component={RedirectToDashboard} />
      <Route path="/claim/*" component={RedirectToDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
