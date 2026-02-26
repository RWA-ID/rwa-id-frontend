import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain, useChainId, usePublicClient } from "wagmi";
import { keccak256, toBytes, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/wallet-button";
import { NavBar } from "@/components/nav-bar";
import { rwaIdV2Abi, RWAID_V2_ADDRESS, usdcAbi, USDC_ADDRESS, CHAIN_ID } from "@/lib/abi";
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
  BadgeCheck,
  DollarSign,
} from "lucide-react";

interface ClaimableIdentity {
  slug: string;
  projectId: string;
  name: string;
  nameHash: string;
  proof: string[];
}

interface ClaimableResponse {
  claims: ClaimableIdentity[];
  error?: string;
}

function formatUsdcFee(fee: bigint): string {
  const formatted = formatUnits(fee, 6);
  const num = parseFloat(formatted);
  return num.toFixed(2);
}

function ClaimCard({
  claim,
  onChainProjectId,
  claimFee,
  isWrongNetwork,
}: {
  claim: ClaimableIdentity;
  onChainProjectId: bigint | undefined;
  claimFee: bigint;
  isWrongNetwork: boolean;
}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [alreadyClaimed, setAlreadyClaimed] = useState<boolean | null>(null);
  const [step, setStep] = useState<"idle" | "approving" | "claiming">("idle");

  const { data: isClaimed, isLoading: isCheckingClaimed } = useReadContract({
    address: RWAID_V2_ADDRESS,
    abi: rwaIdV2Abi,
    functionName: "claimed",
    args: onChainProjectId && address ? [onChainProjectId, address] : undefined,
    query: { enabled: !!onChainProjectId && !!address },
  });

  useEffect(() => {
    if (isClaimed !== undefined) {
      setAlreadyClaimed(isClaimed as boolean);
    }
  }, [isClaimed]);

  const { data: currentAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "allowance",
    args: address ? [address, RWAID_V2_ADDRESS] : undefined,
    query: { enabled: !!address && claimFee > BigInt(0) },
  });

  const { writeContract: approveUsdc, data: approveTxHash, isPending: isApprovePending } = useWriteContract();
  const { isLoading: isWaitingApprove, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const { writeContract: claimIdentity, data: claimTxHash, isPending: isClaimPending } = useWriteContract();
  const { isLoading: isWaitingClaim, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  });

  const needsApproval = claimFee > BigInt(0) && (!currentAllowance || (currentAllowance as bigint) < claimFee);

  const handleApprove = useCallback(() => {
    if (!address) return;
    setStep("approving");
    approveUsdc({
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: "approve",
      args: [RWAID_V2_ADDRESS, claimFee],
      chainId: CHAIN_ID,
    }, {
      onError: () => setStep("idle"),
    });
  }, [address, claimFee, approveUsdc]);

  const handleClaim = useCallback(() => {
    if (!onChainProjectId || !address) return;
    setStep("claiming");

    claimIdentity({
      address: RWAID_V2_ADDRESS,
      abi: rwaIdV2Abi,
      functionName: "claim",
      args: [
        onChainProjectId,
        claim.nameHash as `0x${string}`,
        claim.proof as `0x${string}`[],
      ],
      chainId: CHAIN_ID,
    }, {
      onError: () => setStep("idle"),
    });
  }, [onChainProjectId, address, claim, claimIdentity]);

  useEffect(() => {
    if (approveSuccess && step === "approving") {
      handleClaim();
    }
  }, [approveSuccess, step, handleClaim]);

  useEffect(() => {
    if (claimSuccess) {
      setAlreadyClaimed(true);
    }
  }, [claimSuccess]);

  if (isCheckingClaimed) {
    return (
      <div className="p-5 rounded-xl bg-card border" data-testid={`card-loading-${claim.slug}-${claim.name}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-lg font-semibold truncate">
              {claim.name}.{claim.slug}.rwa-id.eth
            </p>
            <p className="text-sm text-muted-foreground">Checking status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyClaimed || claimSuccess) {
    return (
      <div
        className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20"
        data-testid={`card-claimed-${claim.slug}-${claim.name}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <BadgeCheck className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-lg font-semibold text-green-700 dark:text-green-400" data-testid={`text-claimed-${claim.slug}-${claim.name}`}>
              {claim.name}.{claim.slug}.rwa-id.eth
            </p>
            <p className="text-sm text-muted-foreground">
              {claimSuccess ? "Successfully claimed" : "Already claimed"}
            </p>
          </div>
          {claimTxHash && (
            <a
              href={`https://etherscan.io/tx/${claimTxHash}`}
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

  const isBusy = isCheckingClaimed || isApprovePending || isWaitingApprove || isClaimPending || isWaitingClaim;

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
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {claim.slug}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Project #{onChainProjectId?.toString() || "..."}
            </span>
            {claimFee > BigInt(0) && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {formatUsdcFee(claimFee)} USDC
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={needsApproval ? handleApprove : handleClaim}
          disabled={isWrongNetwork || isBusy || !onChainProjectId}
          data-testid={`button-claim-${claim.slug}-${claim.name}`}
        >
          {isApprovePending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Approve...
            </>
          ) : isWaitingApprove ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Approving...
            </>
          ) : isClaimPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Confirm...
            </>
          ) : isWaitingClaim ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Claiming...
            </>
          ) : needsApproval ? (
            "Approve USDC spend"
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Claim
            </>
          )}
        </Button>
      </div>

      {(claimTxHash || approveTxHash) && !claimSuccess && (
        <div className="mt-4 pt-4 border-t">
          <a
            href={`https://etherscan.io/tx/${claimTxHash || approveTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-mono text-xs">
              {(claimTxHash || approveTxHash)?.slice(0, 12)}...{(claimTxHash || approveTxHash)?.slice(-8)}
            </span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function ClaimCardWithProjectId({ claim, isWrongNetwork }: { claim: ClaimableIdentity; isWrongNetwork: boolean }) {
  const publicClient = usePublicClient();
  const slugHash = keccak256(toBytes(claim.slug.trim().toLowerCase()));
  const [projectId, setProjectId] = useState<bigint | undefined>(undefined);
  const [claimFee, setClaimFee] = useState<bigint>(BigInt(0));

  useEffect(() => {
    if (!publicClient) return;

    let cancelled = false;
    const findProject = async () => {
      let consecutiveErrors = 0;
      for (let i = 1; i <= 50; i++) {
        if (cancelled) return;
        try {
          const projectInfo = await publicClient.readContract({
            address: RWAID_V2_ADDRESS,
            abi: rwaIdV2Abi,
            functionName: "projects",
            args: [BigInt(i)],
          }) as readonly [string, string, string, string, bigint, boolean, string, boolean, bigint, bigint];

          consecutiveErrors = 0;
          if (projectInfo[2] === slugHash) {
            if (!cancelled) {
              setProjectId(BigInt(i));
              setClaimFee(projectInfo[4]);
            }
            return;
          }
        } catch {
          consecutiveErrors++;
          if (consecutiveErrors >= 3) return;
        }
      }
    };

    findProject();
    return () => { cancelled = true; };
  }, [publicClient, slugHash]);

  return (
    <ClaimCard
      claim={claim}
      onChainProjectId={projectId}
      claimFee={claimFee}
      isWrongNetwork={isWrongNetwork}
    />
  );
}

export default function Claim() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const actualChainId = chain?.id ?? chainId;
  const isWrongNetwork = isConnected && actualChainId !== CHAIN_ID;
  const isCorrectNetwork = isConnected && actualChainId === CHAIN_ID;

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
      <NavBar showWallet />

      <main className="py-12 sm:py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
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
                    Please switch to Ethereum Mainnet to claim your identities
                  </p>
                  <Button
                    onClick={() => switchChain({ chainId: CHAIN_ID })}
                    data-testid="button-switch-network"
                  >
                    Switch to Ethereum
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
                      <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
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

          {isCorrectNetwork && (
            <div className="mt-8 text-center">
              <Badge variant="outline" className="text-xs gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Connected to Ethereum Mainnet
              </Badge>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
