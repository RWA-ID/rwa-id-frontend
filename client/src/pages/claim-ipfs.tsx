import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain, useChainId } from "wagmi";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavBar } from "@/components/nav-bar";
import { WalletButton } from "@/components/wallet-button";
import { rwaIdV2Abi, RWAID_V2_ADDRESS, usdcAbi, USDC_ADDRESS, CHAIN_ID } from "@/lib/abi";
import {
  Fingerprint,
  CheckCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Wallet,
  Shield,
  BadgeCheck,
  DollarSign,
  Globe,
} from "lucide-react";

const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
];

interface ProofEntry {
  name: string;
  address: string;
  nameHash: string;
  proof: string[];
}

interface ProofFile {
  projectId: string;
  root: string;
  entries: ProofEntry[];
}

function formatUsdcFee(fee: bigint): string {
  const formatted = formatUnits(fee, 6);
  return parseFloat(formatted).toFixed(2);
}

export default function ClaimIpfs({ params }: { params: { projectId: string; cid: string } }) {
  const { projectId, cid } = params;
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const actualChainId = chain?.id ?? chainId;
  const isWrongNetwork = isConnected && actualChainId !== CHAIN_ID;

  const [proofFile, setProofFile] = useState<ProofFile | null>(null);
  const [userEntry, setUserEntry] = useState<ProofEntry | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [fetching, setFetching] = useState(true);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [step, setStep] = useState<"idle" | "approving" | "claiming">("idle");

  const isValidProjectId = /^\d+$/.test(projectId);

  useEffect(() => {
    let cancelled = false;
    async function fetchProofs() {
      setFetching(true);
      setFetchError("");
      for (const gateway of GATEWAYS) {
        if (cancelled) return;
        try {
          const res = await fetch(`${gateway}${cid}`, { signal: AbortSignal.timeout(10000) });
          if (res.ok) {
            const data = await res.json();
            if (!data.entries || !Array.isArray(data.entries)) {
              throw new Error("Invalid proof file format");
            }
            if (!cancelled) {
              setProofFile(data as ProofFile);
              setFetching(false);
            }
            return;
          }
        } catch {}
      }
      if (!cancelled) {
        setFetchError("Could not load proofs from IPFS. Please try again in a moment.");
        setFetching(false);
      }
    }
    fetchProofs();
    return () => { cancelled = true; };
  }, [cid]);

  useEffect(() => {
    if (!proofFile || !address) {
      setUserEntry(null);
      return;
    }
    const entry = proofFile.entries.find(
      (e) => e.address.toLowerCase() === address.toLowerCase()
    );
    setUserEntry(entry ?? null);
  }, [proofFile, address]);

  const pId = isValidProjectId ? BigInt(projectId) : BigInt(0);

  const { data: project } = useReadContract({
    address: RWAID_V2_ADDRESS,
    abi: rwaIdV2Abi,
    functionName: "projects",
    args: [pId],
    query: { enabled: isValidProjectId },
  });

  const projectSlug = project?.[1] as string | undefined;
  const projectClaimFee = project?.[4] as bigint | undefined;
  const projectTransferable = project?.[5] as boolean | undefined;
  const effectiveFee = projectClaimFee ?? BigInt(0);

  const { data: alreadyClaimed, isLoading: isCheckingClaimed } = useReadContract({
    address: RWAID_V2_ADDRESS,
    abi: rwaIdV2Abi,
    functionName: "claimed",
    args: address ? [pId, address] : undefined,
    query: { enabled: !!address && isValidProjectId },
  });

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "allowance",
    args: address ? [address, RWAID_V2_ADDRESS] : undefined,
    query: { enabled: !!address && effectiveFee > BigInt(0) },
  });

  const needsApproval = effectiveFee > BigInt(0) && (!usdcAllowance || (usdcAllowance as bigint) < effectiveFee);

  const { writeContract: approveUsdc, data: approveTxHash, isPending: isApprovePending } = useWriteContract();
  const { isLoading: isWaitingApprove, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const { writeContract: claimIdentity, data: claimTxHash, isPending: isClaimPending } = useWriteContract();
  const { isLoading: isWaitingClaim, isSuccess: claimTxSuccess } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  });

  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
    }
  }, [approveSuccess, refetchAllowance]);

  useEffect(() => {
    if (approveSuccess && step === "approving") {
      handleClaim();
    }
  }, [approveSuccess, step]);

  useEffect(() => {
    if (claimTxSuccess) {
      setClaimSuccess(true);
    }
  }, [claimTxSuccess]);

  const handleApprove = useCallback(() => {
    if (!address) return;
    setStep("approving");
    approveUsdc({
      address: USDC_ADDRESS,
      abi: usdcAbi,
      functionName: "approve",
      args: [RWAID_V2_ADDRESS, effectiveFee],
      chainId: CHAIN_ID,
    }, {
      onError: () => setStep("idle"),
    });
  }, [address, effectiveFee, approveUsdc]);

  const handleClaim = useCallback(() => {
    if (!userEntry || !address) return;
    setStep("claiming");
    claimIdentity({
      address: RWAID_V2_ADDRESS,
      abi: rwaIdV2Abi,
      functionName: "claim",
      args: [
        pId,
        userEntry.nameHash as `0x${string}`,
        userEntry.proof as `0x${string}`[],
      ],
      chainId: CHAIN_ID,
    }, {
      onError: () => setStep("idle"),
    });
  }, [userEntry, address, pId, claimIdentity]);

  const ensName = userEntry && projectSlug
    ? `${userEntry.name}.${projectSlug}.rwa-id.eth`
    : "";

  const feeDisplay = `$${formatUsdcFee(effectiveFee)} USDC`;
  const balanceDisplay = usdcBalance
    ? `$${formatUsdcFee(usdcBalance as bigint)} USDC`
    : "—";

  const isBusy = isCheckingClaimed || isApprovePending || isWaitingApprove || isClaimPending || isWaitingClaim;

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
              Claim Your RWA ID
            </h1>
            {projectSlug && (
              <p className="text-muted-foreground text-lg">
                {projectSlug}.rwa-id.eth
              </p>
            )}
          </div>

          <Card className="rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              {!isValidProjectId ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold mb-2">
                    Invalid Link
                  </h2>
                  <p className="text-muted-foreground">This claim URL has an invalid project ID.</p>
                </div>
              ) : fetching ? (
                <div className="text-center py-12">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading allowlist from IPFS...</p>
                </div>
              ) : fetchError ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <Globe className="w-8 h-8 text-destructive" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold mb-2">
                    Failed to Load
                  </h2>
                  <p className="text-muted-foreground mb-6">{fetchError}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    data-testid="button-retry-fetch"
                  >
                    Try Again
                  </Button>
                </div>
              ) : !isConnected ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <Wallet className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold mb-2">
                    Connect Your Wallet
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Connect to check if your wallet is on the allowlist
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
                    Please switch to Ethereum Mainnet
                  </p>
                  <Button
                    onClick={() => switchChain({ chainId: CHAIN_ID })}
                    data-testid="button-switch-network"
                  >
                    Switch to Ethereum
                  </Button>
                </div>
              ) : isCheckingClaimed ? (
                <div className="text-center py-12">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Checking claim status...</p>
                </div>
              ) : alreadyClaimed && !claimSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <BadgeCheck className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-green-700 dark:text-green-400 mb-2">
                    Already Claimed
                  </h2>
                  {ensName && (
                    <p className="text-muted-foreground">
                      Your RWA ID: <strong className="text-foreground">{ensName}</strong>
                    </p>
                  )}
                </div>
              ) : claimSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                    Identity Claimed!
                  </h2>
                  {ensName && (
                    <p className="text-lg font-medium mb-2">{ensName}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-6">
                    Your on-chain identity is live and resolves via ENS.
                  </p>
                  {claimTxHash && (
                    <a
                      href={`https://etherscan.io/tx/${claimTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      data-testid="link-claim-tx"
                    >
                      View on Etherscan
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : !userEntry ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold mb-2">
                    Not on Allowlist
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    This wallet is not on the allowlist for this project.
                  </p>
                  <p className="text-sm font-mono text-muted-foreground bg-muted rounded-lg px-4 py-2 inline-block">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Identity detected for your wallet
                    </p>
                    <p className="font-heading text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-identity-name">
                      {ensName}
                    </p>
                  </div>

                  <div className="border-t border-b py-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Claim fee</span>
                      <span className="font-medium flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {feeDisplay}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your USDC balance</span>
                      <span className="font-medium">{balanceDisplay}</span>
                    </div>
                  </div>

                  {needsApproval && (
                    <Button
                      onClick={handleApprove}
                      disabled={isBusy}
                      className="w-full"
                      data-testid="button-approve-usdc"
                    >
                      {isApprovePending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirm in Wallet...
                        </>
                      ) : isWaitingApprove ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Approving USDC...
                        </>
                      ) : (
                        `Step 1 — Approve ${feeDisplay}`
                      )}
                    </Button>
                  )}

                  <Button
                    onClick={handleClaim}
                    disabled={needsApproval || isBusy}
                    className="w-full"
                    variant={needsApproval ? "outline" : "default"}
                    data-testid="button-claim-identity"
                  >
                    {isClaimPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Confirm in Wallet...
                      </>
                    ) : isWaitingClaim ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Claiming...
                      </>
                    ) : needsApproval ? (
                      "Step 2 — Claim Identity (approve first)"
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Claim Identity
                      </>
                    )}
                  </Button>

                  {projectTransferable !== undefined && (
                    <p className="text-xs text-muted-foreground text-center">
                      {projectTransferable
                        ? "This identity is transferable"
                        : "This identity is soulbound (non-transferable)"}
                    </p>
                  )}

                  {(claimTxHash || approveTxHash) && !claimSuccess && (
                    <div className="pt-2 border-t">
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
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center space-y-2">
            {isConnected && !isWrongNetwork && (
              <Badge variant="outline" className="text-xs gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Connected to Ethereum Mainnet
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              Project #{projectId}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
