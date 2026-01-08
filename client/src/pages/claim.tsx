import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from "wagmi";
import { keccak256, toBytes } from "viem";
import { linea } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Sparkles,
  ChevronDown,
  ChevronUp,
  Inbox,
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
  const [isOpen, setIsOpen] = useState(false);
  
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
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-heading font-semibold" data-testid={`text-claimed-${claim.slug}-${claim.name}`}>
                {claim.name}.{claim.slug}.rwa-id.eth
              </p>
              <p className="text-sm text-muted-foreground">Successfully claimed!</p>
            </div>
            {claimTxHash && (
              <a
                href={`https://lineascan.build/tx/${claimTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
                data-testid={`link-tx-${claim.slug}-${claim.name}`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={`card-claim-${claim.slug}-${claim.name}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold truncate" data-testid={`text-identity-${claim.slug}-${claim.name}`}>
              {claim.name}.{claim.slug}.rwa-id.eth
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {claim.slug}
              </Badge>
            </div>
          </div>
          <Button
            onClick={handleClaim}
            disabled={isWrongNetwork || isClaiming || isWaitingClaim || !onChainProjectId}
            size="sm"
            data-testid={`button-claim-${claim.slug}-${claim.name}`}
          >
            {isClaiming || isWaitingClaim ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Claim"
            )}
          </Button>
        </div>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-3 text-xs text-muted-foreground">
              {isOpen ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              Details
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 rounded-lg bg-muted text-xs space-y-1 font-mono">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">projectId:</span>
                <span>{onChainProjectId?.toString() || "loading..."}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">badgeType:</span>
                <span className="truncate max-w-[150px]">0x00...00</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">nameHash:</span>
                <span className="truncate max-w-[150px]">{claim.nameHash.slice(0, 10)}...{claim.nameHash.slice(-6)}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {claimTxHash && !claimSuccess && (
          <a
            href={`https://lineascan.build/tx/${claimTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="font-mono">{claimTxHash.slice(0, 10)}...{claimTxHash.slice(-8)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
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
  const isWrongNetwork = isConnected && chain?.id !== LINEA_CHAIN_ID;

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
    if (isConnected && address) {
      fetchClaimable();
    } else {
      setClaims([]);
      setHasLoaded(false);
    }
  }, [isConnected, address, fetchClaimable]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/" className="flex items-center gap-2">
              <Fingerprint className="h-8 w-8 text-primary" />
              <span className="font-heading text-xl font-bold">RWA-ID</span>
            </Link>
            <div className="flex items-center gap-4 flex-wrap">
              <WalletButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="py-8 sm:py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="w-6 h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="font-heading text-2xl">Claim Your Identity</CardTitle>
              <CardDescription>
                Connect your wallet to see available identities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected ? (
                <div className="p-6 rounded-lg bg-muted text-center">
                  <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your wallet to discover claimable identities
                  </p>
                  <WalletButton />
                </div>
              ) : isWrongNetwork ? (
                <div className="p-4 rounded-lg bg-destructive/10">
                  <div className="flex items-center gap-2 text-destructive mb-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">Wrong Network</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Please switch to Linea Mainnet to claim identities
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => switchChain({ chainId: linea.id })}
                    data-testid="button-switch-network"
                  >
                    Switch to Linea
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="p-6 text-center">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Checking allowlists...</p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-lg bg-destructive/10 text-center">
                  <AlertTriangle className="w-6 h-6 mx-auto text-destructive mb-2" />
                  <p className="text-sm text-destructive">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-3"
                    onClick={fetchClaimable}
                    data-testid="button-retry"
                  >
                    Retry
                  </Button>
                </div>
              ) : hasLoaded && claims.length === 0 ? (
                <div className="p-6 text-center">
                  <Inbox className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No claimable identities for this wallet
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              ) : claims.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Found {claims.length} claimable {claims.length === 1 ? "identity" : "identities"}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={fetchClaimable}
                      disabled={isLoading}
                      data-testid="button-refresh"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
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
        </div>
      </main>
    </div>
  );
}
