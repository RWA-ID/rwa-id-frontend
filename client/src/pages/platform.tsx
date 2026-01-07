import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from "wagmi";
import { linea } from "wagmi/chains";
import { keccak256, encodePacked, parseEther, formatEther } from "viem";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Stepper } from "@/components/stepper";
import { WalletButton } from "@/components/wallet-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { RWA_ID_REGISTRY_ABI, RWA_ID_REGISTRY_ADDRESS, LINEA_CHAIN_ID } from "@/lib/abi";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UploadResponse } from "@shared/schema";
import {
  Fingerprint,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Upload,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle,
  FileText,
  Link as LinkIcon,
} from "lucide-react";

const STEPS = ["Connect", "Create Project", "Upload CSV", "Set Root", "Complete"];

export default function Platform() {
  const { toast } = useToast();
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = isConnected && chain?.id !== LINEA_CHAIN_ID;

  const [currentStep, setCurrentStep] = useState(0);
  const [slug, setSlug] = useState("");
  const [baseURI, setBaseURI] = useState("https://rwa-id.eth/metadata/");
  const [soulbound, setSoulbound] = useState(true);
  const [projectId, setProjectId] = useState<bigint | null>(null);
  const [csvText, setCsvText] = useState("");
  const [merkleRoot, setMerkleRoot] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const { data: projectFee } = useReadContract({
    address: RWA_ID_REGISTRY_ADDRESS,
    abi: RWA_ID_REGISTRY_ABI,
    functionName: "projectFee",
  });

  const slugHash = slug ? keccak256(encodePacked(["string"], [slug])) : undefined;

  const { data: fetchedProjectId, refetch: refetchProjectId } = useReadContract({
    address: RWA_ID_REGISTRY_ADDRESS,
    abi: RWA_ID_REGISTRY_ABI,
    functionName: "projectIdBySlugHash",
    args: slugHash ? [slugHash] : undefined,
    query: {
      enabled: false,
    },
  });

  const { writeContract: createProject, data: createTxHash, isPending: isCreating } = useWriteContract();
  const { isLoading: isWaitingCreate, isSuccess: createSuccess, data: createReceipt } = useWaitForTransactionReceipt({
    hash: createTxHash,
  });

  const { writeContract: setAllowlistRoot, data: setRootTxHash, isPending: isSettingRoot } = useWriteContract();
  const { isLoading: isWaitingSetRoot, isSuccess: setRootSuccess } = useWaitForTransactionReceipt({
    hash: setRootTxHash,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { slug: string; csvText: string }) => {
      const response = await apiRequest<UploadResponse>("POST", "/api/platform/upload", data);
      return response;
    },
    onSuccess: (data) => {
      setMerkleRoot(data.merkleRoot);
      setRowCount(data.rowCount);
      toast({
        title: "CSV Uploaded",
        description: `Merkle tree generated with ${data.rowCount} entries`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process CSV",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = useCallback(() => {
    if (!slug) return;
    const fee = projectFee || parseEther("0.01");
    createProject({
      address: RWA_ID_REGISTRY_ADDRESS,
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "createProject",
      args: [slug, baseURI, soulbound],
      value: fee,
    }, {
      onSuccess: () => {
        toast({
          title: "Transaction Submitted",
          description: "Waiting for confirmation...",
        });
      },
      onError: (error) => {
        toast({
          title: "Transaction Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }, [slug, baseURI, soulbound, projectFee, createProject, toast]);

  const handleSetAllowlistRoot = useCallback(() => {
    if (!projectId || !merkleRoot) return;
    const badgeType = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
    setAllowlistRoot({
      address: RWA_ID_REGISTRY_ADDRESS,
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "setAllowlistRoot",
      args: [projectId, badgeType, merkleRoot as `0x${string}`],
    }, {
      onSuccess: () => {
        toast({
          title: "Transaction Submitted",
          description: "Setting allowlist root...",
        });
      },
      onError: (error) => {
        toast({
          title: "Transaction Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }, [projectId, merkleRoot, setAllowlistRoot, toast]);

  const handleUploadCSV = () => {
    if (!csvText || !slug) return;
    uploadMutation.mutate({ slug, csvText });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const copyClaimLink = () => {
    const link = `${window.location.origin}/claim?slug=${slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return isConnected && !isWrongNetwork;
      case 1:
        return createSuccess && projectId !== null;
      case 2:
        return !!merkleRoot;
      case 3:
        return setRootSuccess;
      default:
        return true;
    }
  };

  useEffect(() => {
    if (createSuccess && projectId === null && slug) {
      const fetchId = async () => {
        try {
          const result = await refetchProjectId();
          if (result.data && result.data > 0n) {
            setProjectId(result.data);
          } else {
            setProjectId(BigInt(1));
          }
        } catch {
          setProjectId(BigInt(1));
        }
      };
      const timer = setTimeout(fetchId, 1500);
      return () => clearTimeout(timer);
    }
  }, [createSuccess, projectId, slug, refetchProjectId]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-2xl">Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect to Linea Mainnet to create your RWA-ID project
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Fingerprint className="w-10 h-10 text-primary" />
              </div>
              <WalletButton />
              {isWrongNetwork && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Please switch to Linea Mainnet
                </div>
              )}
              {isConnected && !isWrongNetwork && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Connected to Linea Mainnet
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Create Project</CardTitle>
              <CardDescription>
                Register your unique namespace on the RWA-ID registry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="slug">Project Slug</Label>
                <Input
                  id="slug"
                  placeholder="e.g., securitize"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  disabled={isCreating || isWaitingCreate}
                  data-testid="input-slug"
                />
                <p className="text-xs text-muted-foreground">
                  Your namespace: *.{slug || "slug"}.rwa-id.eth
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseURI">Base URI</Label>
                <Input
                  id="baseURI"
                  placeholder="https://example.com/metadata/"
                  value={baseURI}
                  onChange={(e) => setBaseURI(e.target.value)}
                  disabled={isCreating || isWaitingCreate}
                  data-testid="input-baseuri"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="soulbound">Soulbound Tokens</Label>
                  <p className="text-xs text-muted-foreground">
                    Non-transferable identity tokens
                  </p>
                </div>
                <Switch
                  id="soulbound"
                  checked={soulbound}
                  onCheckedChange={setSoulbound}
                  disabled={isCreating || isWaitingCreate}
                  data-testid="switch-soulbound"
                />
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Project Fee</span>
                  <span className="font-mono font-medium">
                    {projectFee ? `${formatEther(projectFee)} ETH` : "~0.01 ETH"}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleCreateProject}
                disabled={!slug || isCreating || isWaitingCreate || createSuccess}
                className="w-full"
                data-testid="button-create-project"
              >
                {isCreating || isWaitingCreate ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCreating ? "Confirm in Wallet..." : "Creating..."}
                  </>
                ) : createSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Project Created
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
              {createTxHash && (
                <a
                  href={`https://lineascan.build/tx/${createTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  data-testid="link-create-tx"
                >
                  <span className="font-mono">{createTxHash.slice(0, 10)}...{createTxHash.slice(-8)}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Upload Allowlist</CardTitle>
              <CardDescription>
                Upload a CSV with name and address columns to generate the Merkle tree
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover-elevate transition-colors"
                onClick={() => document.getElementById("csv-upload")?.click()}
              >
                <input
                  type="file"
                  id="csv-upload"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  data-testid="input-csv-file"
                />
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">Drop CSV file or click to upload</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Format: name,address
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or paste CSV content</span>
                </div>
              </div>
              <Textarea
                placeholder={`name,address\nhector,0x1234...abcd\nalice,0xabcd...1234`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
                data-testid="textarea-csv"
              />
              <Button
                onClick={handleUploadCSV}
                disabled={!csvText || uploadMutation.isPending || !!merkleRoot}
                className="w-full"
                data-testid="button-upload-csv"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : merkleRoot ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    CSV Processed
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Merkle Tree
                  </>
                )}
              </Button>
              {merkleRoot && (
                <div className="p-4 rounded-lg bg-muted space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Entries</span>
                    <span className="font-medium">{rowCount}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Merkle Root</span>
                    <p className="font-mono text-xs break-all bg-background p-2 rounded" data-testid="text-merkle-root">
                      {merkleRoot}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Set Allowlist Root</CardTitle>
              <CardDescription>
                Submit the Merkle root on-chain to enable claims
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Project ID</span>
                  <span className="font-mono font-medium">{projectId?.toString() || "1"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Badge Type</span>
                  <span className="font-mono text-xs">0x00...00</span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Merkle Root</span>
                  <p className="font-mono text-xs break-all bg-background p-2 rounded">
                    {merkleRoot}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSetAllowlistRoot}
                disabled={!merkleRoot || isSettingRoot || isWaitingSetRoot || setRootSuccess}
                className="w-full"
                data-testid="button-set-root"
              >
                {isSettingRoot || isWaitingSetRoot ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSettingRoot ? "Confirm in Wallet..." : "Setting Root..."}
                  </>
                ) : setRootSuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Root Set Successfully
                  </>
                ) : (
                  "Set Allowlist Root"
                )}
              </Button>
              {setRootTxHash && (
                <a
                  href={`https://lineascan.build/tx/${setRootTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  data-testid="link-setroot-tx"
                >
                  <span className="font-mono">{setRootTxHash.slice(0, 10)}...{setRootTxHash.slice(-8)}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <CardTitle className="font-heading text-2xl">Project Created!</CardTitle>
              <CardDescription>
                Your RWA-ID namespace is now live on Linea
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground mb-2">Claim Link</p>
                <p className="font-mono text-sm break-all" data-testid="text-claim-link">
                  {window.location.origin}/claim?slug={slug}
                </p>
              </div>
              <Button
                onClick={copyClaimLink}
                variant="outline"
                className="w-full"
                data-testid="button-copy-claim-link"
              >
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Claim Link
                  </>
                )}
              </Button>
              <Link href={`/claim?slug=${slug}`}>
                <Button className="w-full" data-testid="button-view-claim">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  View Claim Page
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setCurrentStep(0);
                  setSlug("");
                  setProjectId(null);
                  setCsvText("");
                  setMerkleRoot("");
                  setRowCount(0);
                }}
                data-testid="button-create-another"
              >
                Create Another Project
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

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

      <main className="py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">
              Platform Onboarding
            </h1>
            <p className="text-muted-foreground">
              Create your RWA-ID namespace in a few simple steps
            </p>
          </div>

          <Stepper steps={STEPS} currentStep={currentStep} />

          {renderStepContent()}

          <div className="flex items-center justify-between max-w-lg mx-auto mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
              disabled={!canProceed() || currentStep === STEPS.length - 1}
              data-testid="button-continue"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
