import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from "wagmi";
import { keccak256, toBytes } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/wallet-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { RWA_ID_REGISTRY_ABI, RWA_ID_REGISTRY_ADDRESS, LINEA_CHAIN_ID, BADGE_TYPE_DEFAULT } from "@/lib/abi";
import { useToast } from "@/hooks/use-toast";
import {
  Fingerprint,
  CheckCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Wallet,
  RefreshCw,
  Shield,
  Sparkles,
} from "lucide-react";

interface ClaimableIdentity {
  slug: string;
  projectId: string;
  badgeType: string;
  name: string;
  nameHash: string;
  proof: string[];
}

interface ClaimableResponse {
  claims: ClaimableIdentity[];
  error?: string;
}

function ClaimCard({ 
  claim, 
  onChainProjectId,
  isWrongNetwork 
}: { 
  claim: ClaimableIdentity;
  onChainProjectId: bigint | undefined;
  isWrongNetwork: boolean;
}) {
  const { toast } = useToast();
  const { address } = useAccount();
  
  const { writeContract: claimSoulbound, data: claimTxHash, isPending: isClaiming } = useWriteContract();
  const { isLoading: isWaitingClaim, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  });

  const handleClaim = useCallback(() => {
    if (!onChainProjectId || !address) return;
    
    claimSoulbound({
      address: RWA_ID_REGISTRY_ADDRESS,
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "claimSoulbound",
      args: [
        onChainProjectId,
        BADGE_TYPE_DEFAULT,
        claim.nameHash as `0x${string}`,
        claim.name,
        claim.proof as `0x${string}`[],
      ],
    }, {
      onSuccess: () => {
        toast({
          title: "Transaction Submitted",
          description: `Claiming ${claim.name}.${claim.slug}.rwa-id.eth...`,
        });
      },
      onError: (error) => {
        toast({
          title: "Claim Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }, [onChainProjectId, address, claim, claimSoulbound, toast]);

  if (claimSuccess) {
    return (
      <div 
        className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20"
        data-testid={`card-claimed-${claim.slug}-${claim.name}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-lg font-semibold text-green-700 dark:text-green-400" data-testid={`text-claimed-${claim.slug}-${claim.name}`}>
              {claim.name}.{claim.slug}.rwa-id.eth
            </p>
            <p className="text-sm text-muted-foreground">Successfully claimed</p>
          </div>
          {claimTxHash && (
            <a
              href={`https://lineascan.build/tx/${claimTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:underline"
              data-testid={`link-tx-${claim.slug}-${claim.name}`}
            >
              View
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-5 rounded-xl bg-card border hover-elevate transition-all"
      data-testid={`card-claim-${claim.slug}-${claim.name}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Fingerprint className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-lg font-semibold truncate" data-testid={`text-identity-${claim.slug}-${claim.name}`}>
            {claim.name}.{claim.slug}.rwa-id.eth
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {claim.slug}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Project #{onChainProjectId?.toString() || "..."}
            </span>
          </div>
        </div>
        <Button
          onClick={handleClaim}
          disabled={isWrongNetwork || isClaiming || isWaitingClaim || !onChainProjectId}
          data-testid={`button-claim-${claim.slug}-${claim.name}`}
        >
          {isClaiming || isWaitingClaim ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isClaiming ? "Confirm..." : "Claiming..."}
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Claim
            </>
          )}
        </Button>
      </div>

      {claimTxHash && !claimSuccess && (
        <div className="mt-4 pt-4 border-t">
          <a
            href={`https://lineascan.build/tx/${claimTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-mono text-xs">{claimTxHash.slice(0, 12)}...{claimTxHash.slice(-8)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function ClaimCardWithProjectId({ claim, isWrongNetwork }: { claim: ClaimableIdentity; isWrongNetwork: boolean }) {
  const slugHash = keccak256(toBytes(claim.slug.trim().toLowerCase()));
  
  const { data: projectId } = useReadContract({
    address: RWA_ID_REGISTRY_ADDRESS,
    abi: RWA_ID_REGISTRY_ABI,
    functionName: "projectIdBySlugHash",
    args: [slugHash],
  });

  return (
    <ClaimCard 
      claim={claim} 
      onChainProjectId={projectId as bigint | undefined}
      isWrongNetwork={isWrongNetwork}
    />
  );
}

export default function Claim() {
  const { toast } = useToast();
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  // Only show wrong network if chain is defined and it's not Linea
  const isWrongNetwork = isConnected && chain !== undefined && chain.id !== LINEA_CHAIN_ID;
  const isCorrectNetwork = isConnected && chain !== undefined && chain.id === LINEA_CHAIN_ID;

  const [claims, setClaims] = useState<ClaimableIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClaimable = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/claimable?address=${address}`);
      const data: ClaimableResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
        setClaims([]);
      } else {
        setClaims(data.claims || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch claimable identities");
      setClaims([]);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address && !isWrongNetwork) {
      fetchClaimable();
    } else {
      setClaims([]);
      setHasLoaded(false);
    }
  }, [isConnected, address, isWrongNetwork, fetchClaimable]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/" className="flex items-center gap-2" data-testid="link-home">
              <Fingerprint className="h-8 w-8 text-primary" />
              <span className="font-heading text-xl font-bold">RWA-ID</span>
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              {isCorrectNetwork && (
                <Badge variant="outline" className="text-xs gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Linea
                </Badge>
              )}
              <WalletButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="py-12 sm:py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Fingerprint className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
              Claim Your Identity
            </h1>
            <p className="text-muted-foreground text-lg">
              Connect your wallet to discover and claim your on-chain identities
            </p>
          </div>

          {/* Main Card */}
          <Card className="rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              {!isConnected ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <Wallet className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold mb-2">
                    Connect Your Wallet
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    We'll automatically find all identities available for your wallet address
                  </p>
                  <div className="flex justify-center">
                    <WalletButton />
                  </div>
                </div>
              ) : isWrongNetwork ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold mb-2">
                    Wrong Network
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Please switch to Linea Mainnet to claim your identities
                  </p>
                  <Button 
                    onClick={() => switchChain({ chainId: LINEA_CHAIN_ID })}
                    data-testid="button-switch-network"
                  >
                    Switch to Linea
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Checking allowlists...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-muted-foreground mb-6">{error}</p>
                  <Button 
                    variant="outline"
                    onClick={fetchClaimable}
                    data-testid="button-retry"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : hasLoaded && claims.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold mb-2">
                    No Identities Found
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    No claimable identities are available for this wallet
                  </p>
                  <p className="text-sm font-mono text-muted-foreground bg-muted rounded-lg px-4 py-2 inline-block">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                  <div className="mt-6">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={fetchClaimable}
                      data-testid="button-refresh"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              ) : claims.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-heading text-xl font-semibold">
                        Your Identities
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {claims.length} {claims.length === 1 ? "identity" : "identities"} available to claim
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={fetchClaimable}
                      disabled={isLoading}
                      data-testid="button-refresh"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {claims.map((claim, index) => (
                      <ClaimCardWithProjectId 
                        key={`${claim.slug}-${claim.name}-${index}`}
                        claim={claim}
                        isWrongNetwork={isWrongNetwork}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Identities are soulbound tokens on Linea Mainnet
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
