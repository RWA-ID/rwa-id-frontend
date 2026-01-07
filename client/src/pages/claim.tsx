import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { linea } from "wagmi/chains";
import { keccak256, encodePacked } from "viem";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletButton } from "@/components/wallet-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { RWA_ID_REGISTRY_ABI, RWA_ID_REGISTRY_ADDRESS, LINEA_CHAIN_ID } from "@/lib/abi";
import { useToast } from "@/hooks/use-toast";
import type { ProofResponse } from "@shared/schema";
import {
  Fingerprint,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export default function Claim() {
  const { toast } = useToast();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const slugFromUrl = params.get("slug") || "";
  
  const { address, isConnected, chain } = useAccount();
  const isWrongNetwork = isConnected && chain?.id !== LINEA_CHAIN_ID;

  const [slug, setSlug] = useState(slugFromUrl);
  const [name, setName] = useState("");
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (slugFromUrl) {
      setSlug(slugFromUrl);
    }
  }, [slugFromUrl]);

  const slugHash = slug ? keccak256(encodePacked(["string"], [slug])) : null;

  const { data: projectId } = useReadContract({
    address: RWA_ID_REGISTRY_ADDRESS,
    abi: RWA_ID_REGISTRY_ABI,
    functionName: "projectIdBySlugHash",
    args: slugHash ? [slugHash] : undefined,
    query: {
      enabled: !!slugHash,
    },
  });

  const { data: proofData, isLoading: isCheckingEligibility, refetch: checkEligibility } = useQuery<ProofResponse>({
    queryKey: ["/api/proof", slug, name, address],
    queryFn: async () => {
      const params = new URLSearchParams({
        slug,
        name: name.toLowerCase(),
        address: address || "",
      });
      const response = await fetch(`/api/proof?${params}`);
      if (!response.ok) {
        throw new Error("Failed to check eligibility");
      }
      return response.json();
    },
    enabled: false,
  });

  const { writeContract: claimSoulbound, data: claimTxHash, isPending: isClaiming } = useWriteContract();
  const { isLoading: isWaitingClaim, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  });

  const handleCheckEligibility = async () => {
    if (!slug || !name || !address) return;
    setHasChecked(true);
    await checkEligibility();
  };

  const handleClaim = () => {
    if (!proofData || !proofData.eligible || !projectId) return;
    
    const badgeType = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
    
    claimSoulbound({
      address: RWA_ID_REGISTRY_ADDRESS,
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "claimSoulbound",
      args: [
        projectId,
        badgeType,
        proofData.nameHash as `0x${string}`,
        name.toLowerCase(),
        proofData.proof as `0x${string}`[],
      ],
    }, {
      onSuccess: () => {
        toast({
          title: "Transaction Submitted",
          description: "Claiming your RWA-ID...",
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
  };

  const isEligible = hasChecked && proofData?.eligible;
  const isNotEligible = hasChecked && proofData && !proofData.eligible;

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
          {claimSuccess ? (
            <Card>
              <CardHeader className="text-center">
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 relative">
                  <Sparkles className="w-12 h-12 text-green-500" />
                  <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-pulse" />
                </div>
                <CardTitle className="font-heading text-2xl">Congratulations!</CardTitle>
                <CardDescription>
                  You have successfully claimed your RWA-ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your Verified Identity</p>
                  <p className="font-heading text-2xl font-bold" data-testid="text-claimed-name">
                    {name.toLowerCase()}.{slug}.rwa-id.eth
                  </p>
                </div>
                {claimTxHash && (
                  <a
                    href={`https://lineascan.build/tx/${claimTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    data-testid="link-claim-tx"
                  >
                    View Transaction
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Return to Home
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Fingerprint className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="font-heading text-2xl">Claim Your Identity</CardTitle>
                <CardDescription>
                  {slug ? (
                    <span className="font-mono text-primary">{slug}.rwa-id.eth</span>
                  ) : (
                    "Enter your project slug to get started"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!slugFromUrl && (
                  <div className="space-y-2">
                    <Label htmlFor="slug">Project Slug</Label>
                    <Input
                      id="slug"
                      placeholder="e.g., acme"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value.toLowerCase());
                        setHasChecked(false);
                      }}
                      data-testid="input-claim-slug"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="name"
                      placeholder="e.g., hector"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                        setHasChecked(false);
                      }}
                      className="flex-1"
                      data-testid="input-claim-name"
                    />
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      .{slug || "slug"}.rwa-id.eth
                    </span>
                  </div>
                </div>

                {!isConnected ? (
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your wallet to check eligibility
                    </p>
                    <WalletButton />
                  </div>
                ) : isWrongNetwork ? (
                  <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">Please switch to Linea Mainnet</span>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handleCheckEligibility}
                      disabled={!slug || !name || !address || isCheckingEligibility}
                      variant="outline"
                      className="w-full"
                      data-testid="button-check-eligibility"
                    >
                      {isCheckingEligibility ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        "Check Eligibility"
                      )}
                    </Button>

                    {isEligible && (
                      <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">You are eligible to claim!</span>
                      </div>
                    )}

                    {isNotEligible && (
                      <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                        <XCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">Not on allowlist for this wallet</span>
                      </div>
                    )}

                    <Button
                      onClick={handleClaim}
                      disabled={!isEligible || isClaiming || isWaitingClaim || claimSuccess}
                      className="w-full"
                      size="lg"
                      data-testid="button-claim"
                    >
                      {isClaiming || isWaitingClaim ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isClaiming ? "Confirm in Wallet..." : "Claiming..."}
                        </>
                      ) : (
                        <>
                          <Fingerprint className="mr-2 h-4 w-4" />
                          Claim Identity
                        </>
                      )}
                    </Button>

                    {claimTxHash && !claimSuccess && (
                      <a
                        href={`https://lineascan.build/tx/${claimTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <span className="font-mono">{claimTxHash.slice(0, 10)}...{claimTxHash.slice(-8)}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
