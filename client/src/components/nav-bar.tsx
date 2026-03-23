import { Link, useLocation } from "wouter";
import { Fingerprint, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function NavBar({ showWallet = false }: { showWallet?: boolean }) {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <Fingerprint className="h-8 w-8 text-primary" />
            <span className="font-heading text-xl font-bold">RWA-ID</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="https://dashboard.rwa-id.com" target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="sm"
                data-testid="link-dashboard-nav"
              >
                Platform Dashboard
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </Button>
            </a>
            {showWallet && <WalletButton />}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
