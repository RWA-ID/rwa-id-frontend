import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { keccak256, toBytes } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletButton } from "@/components/wallet-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { RWA_ID_REGISTRY_ABI, RWA_ID_REGISTRY_ADDRESS, LINEA_CHAIN_ID, BADGE_TYPE_DEFAULT } from "@/lib/abi";
import { useToast } from "@/hooks/use-toast";
import {
  Fingerprint,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  Upload,
  Globe,
  FileText,
} from "lucide-react";

interface ProofsJsonEntry {
  name: string;
  nameHash: string;
  proof: string[];
}

interface ProofsJson {
  chainId?: number;
  registry?: string;
  slug?: string;
  slugHash?: string;
  projectId?: string;
  badgeType?: string;
  merkleRoot?: string;
  entries: Record<string, ProofsJsonEntry>;
}

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
  const [proofSource, setProofSource] = useState<"url" | "upload" | "paste">("url");
  const [proofsUrl, setProofsUrl] = useState("");
  const [proofsJson, setProofsJson] = useState("");
  const [parsedProofs, setParsedProofs] = useState<ProofsJson | null>(null);
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);
  const [proofData, setProofData] = useState<{ proof: string[]; nameHash: string; eligible: boolean } | null>(null);

  useEffect(() => {
    if (slugFromUrl) {
      setSlug(slugFromUrl);
    }
  }, [slugFromUrl]);

  const slugHash = slug ? keccak256(toBytes(slug.trim().toLowerCase())) : null;

  const { data: projectId } = useReadContract({
    address: RWA_ID_REGISTRY_ADDRESS,
    abi: RWA_ID_REGISTRY_ABI,
    functionName: "projectIdBySlugHash",
    args: slugHash ? [slugHash] : undefined,
    query: {
      enabled: !!slugHash,
    },
  });

  const { writeContract: claimSoulbound, data: claimTxHash, isPending: isClaiming } = useWriteContract();
  const { isLoading: isWaitingClaim, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  });

  const loadProofsFromUrl = async () => {
    if (!proofsUrl) return;
    
    // Trim whitespace
    const urlString = proofsUrl.trim();
    
    // Validate URL format - accept http:// and https://
    let validUrl: URL;
    try {
      validUrl = new URL(urlString);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error("URL must start with http:// or https://");
      }
    } catch (urlError) {
      const msg = urlError instanceof Error ? urlError.message : "Invalid URL format";
      toast({ 
        title: "Invalid URL", 
        description: `Please enter a valid URL (e.g., https://example.com/proofs.json). Error: ${msg}`, 
        variant: "destructive" 
      });
      return;
    }
    
    setIsLoadingProofs(true);
    try {
      const response = await fetch(validUrl.toString());
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Response is not valid JSON");
      }
      setParsedProofs(data);
      toast({ title: "Proofs Loaded", description: "Successfully loaded proofs from URL" });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast({ title: "Failed to Load Proofs", description: msg, variant: "destructive" });
    } finally {
      setIsLoadingProofs(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setParsedProofs(data);
        toast({ title: "Proofs Loaded", description: "Successfully loaded proofs from file" });
      } catch {
        toast({ title: "Invalid JSON", description: "Failed to parse proofs file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const parseProofsJson = () => {
    if (!proofsJson) return;
    try {
      const data = JSON.parse(proofsJson);
      setParsedProofs(data);
      toast({ title: "Proofs Loaded", description: "Successfully parsed proofs JSON" });
    } catch {
      toast({ title: "Invalid JSON", description: "Failed to parse proofs", variant: "destructive" });
    }
  };

  const handleCheckEligibility = () => {
    if (!parsedProofs || !address || !name) return;
    setHasChecked(true);
    
    const entry = parsedProofs.entries[address.toLowerCase()];
    if (entry && entry.name.toLowerCase() === name.toLowerCase()) {
      setProofData({
        proof: entry.proof,
        nameHash: entry.nameHash,
        eligible: true,
      });
    } else {
      const nameHash = keccak256(toBytes(name.trim().toLowerCase()));
      setProofData({
        proof: [],
        nameHash,
        eligible: false,
      });
    }
  };

  const handleClaim = () => {
    if (!proofData || !proofData.eligible || !projectId) return;
    
    claimSoulbound({
      address: RWA_ID_REGISTRY_ADDRESS,
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "claimSoulbound",
      args: [
        projectId,
        BADGE_TYPE_DEFAULT,
        proofData.nameHash as `0x${string}`,
        name.trim().toLowerCase(),
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
  const computedNameHash = name ? keccak256(toBytes(name.trim().toLowerCase())) : null;

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
                  <Label>Proofs Source</Label>
                  <Tabs value={proofSource} onValueChange={(v) => setProofSource(v as typeof proofSource)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="url" data-testid="tab-proofs-url">
                        <Globe className="w-4 h-4 mr-1" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="upload" data-testid="tab-proofs-upload">
                        <Upload className="w-4 h-4 mr-1" />
                        Upload
                      </TabsTrigger>
                      <TabsTrigger value="paste" data-testid="tab-proofs-paste">
                        <FileText className="w-4 h-4 mr-1" />
                        Paste
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="url" className="space-y-2">
                      <Input
                        placeholder="https://example.com/proofs.json"
                        value={proofsUrl}
                        onChange={(e) => setProofsUrl(e.target.value)}
                        data-testid="input-proofs-url"
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={loadProofsFromUrl}
                        disabled={!proofsUrl || isLoadingProofs}
                        data-testid="button-load-proofs-url"
                      >
                        {isLoadingProofs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Load Proofs
                      </Button>
                    </TabsContent>
                    <TabsContent value="upload" className="space-y-2">
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover-elevate"
                        onClick={() => document.getElementById("proofs-file")?.click()}
                      >
                        <input
                          type="file"
                          id="proofs-file"
                          accept=".json"
                          className="hidden"
                          onChange={handleFileUpload}
                          data-testid="input-proofs-file"
                        />
                        <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload proofs JSON</p>
                      </div>
                    </TabsContent>
                    <TabsContent value="paste" className="space-y-2">
                      <Textarea
                        placeholder='{"entries": { "0x...": { ... } }}'
                        value={proofsJson}
                        onChange={(e) => setProofsJson(e.target.value)}
                        className="min-h-[100px] font-mono text-xs"
                        data-testid="textarea-proofs-json"
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={parseProofsJson}
                        disabled={!proofsJson}
                        data-testid="button-parse-proofs"
                      >
                        Parse Proofs
                      </Button>
                    </TabsContent>
                  </Tabs>
                  {parsedProofs && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Proofs loaded ({Object.keys(parsedProofs.entries || {}).length} entries)
                    </div>
                  )}
                </div>

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
                      disabled={!parsedProofs || !name || !address}
                      variant="outline"
                      className="w-full"
                      data-testid="button-check-eligibility"
                    >
                      Check Eligibility
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

                {(slugHash || projectId !== undefined || computedNameHash) && (
                  <div className="p-4 rounded-lg bg-muted space-y-2 text-xs">
                    <p className="text-muted-foreground font-medium mb-2">Debug Info</p>
                    {slugHash && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">slugHash:</span>
                        <span className="font-mono truncate max-w-[200px]">{slugHash}</span>
                      </div>
                    )}
                    {projectId !== undefined && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">projectId:</span>
                        <span className="font-mono">{projectId?.toString()}</span>
                      </div>
                    )}
                    {computedNameHash && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">nameHash:</span>
                        <span className="font-mono truncate max-w-[200px]">{computedNameHash}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">badgeType:</span>
                      <span className="font-mono">0x00...00</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">registry:</span>
                      <span className="font-mono truncate max-w-[200px]">{RWA_ID_REGISTRY_ADDRESS}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
