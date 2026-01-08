import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain, usePublicClient } from "wagmi";
import { linea } from "wagmi/chains";
import { keccak256, toBytes, parseEther, formatEther, encodeFunctionData, formatGwei } from "viem";
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
import { RWA_ID_REGISTRY_ABI, RWA_ID_REGISTRY_ADDRESS, LINEA_CHAIN_ID, BADGE_TYPE_DEFAULT } from "@/lib/abi";
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
  Download,
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
  const [validFrom, setValidFrom] = useState("0");
  const [validTo, setValidTo] = useState("0");
  const [proofsData, setProofsData] = useState<Record<string, { name: string; nameHash: string; proof: string[] }> | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [gasError, setGasError] = useState<string | null>(null);
  const [projectAdmin, setProjectAdmin] = useState<string | null>(null);

  const publicClient = usePublicClient();

  const { data: projectFee } = useReadContract({
    address: RWA_ID_REGISTRY_ADDRESS,
    abi: RWA_ID_REGISTRY_ABI,
    functionName: "projectFee",
  });

  const slugHash = slug ? keccak256(toBytes(slug.trim().toLowerCase())) : undefined;

  const { data: fetchedProjectId, refetch: refetchProjectId } = useReadContract({
    address: RWA_ID_REGISTRY_ADDRESS,
    abi: RWA_ID_REGISTRY_ABI,
    functionName: "projectIdBySlugHash",
    args: slugHash ? [slugHash] : undefined,
    query: {
      enabled: false,
    },
  });

  const { writeContract: createProject, data: createTxHash, isPending: isCreating, reset: resetCreateProject } = useWriteContract();
  const { isLoading: isWaitingCreate, isSuccess: createSuccess, data: createReceipt } = useWaitForTransactionReceipt({
    hash: createTxHash,
  });

  const { writeContract: setAllowlistRoot, data: setRootTxHash, isPending: isSettingRoot, reset: resetSetRoot } = useWriteContract();
  const { isLoading: isWaitingSetRoot, isSuccess: setRootSuccess } = useWaitForTransactionReceipt({
    hash: setRootTxHash,
  });
  
  // Reset createProject mutation when moving to step 3 to prevent stale transactions
  useEffect(() => {
    if (currentStep === 3 && createSuccess) {
      // Clear any pending createProject state to avoid confusion
      console.log("Resetting createProject mutation state for step 3");
    }
  }, [currentStep, createSuccess]);

  // Fetch on-chain project admin to verify ownership
  const { data: projectData } = useReadContract({
    address: RWA_ID_REGISTRY_ADDRESS,
    abi: RWA_ID_REGISTRY_ABI,
    functionName: "projects",
    args: projectId ? [projectId] : undefined,
    query: {
      enabled: !!projectId,
    },
  });
  
  // Extract admin from project data (projects returns [admin, soulbound, paused, baseURI])
  const onChainAdmin = projectData?.[0] as string | undefined;

  const uploadMutation = useMutation({
    mutationFn: async (data: { slug: string; csvText: string }) => {
      const response = await apiRequest("POST", "/api/platform/upload", data);
      return response.json() as Promise<UploadResponse & { proofs?: Record<string, { name: string; nameHash: string; proof: string[] }> }>;
    },
    onSuccess: (data) => {
      setMerkleRoot(data.merkleRoot);
      setRowCount(data.rowCount);
      if (data.proofs) {
        setProofsData(data.proofs);
      }
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
    console.log("=== handleCreateProject CALLED ===");
    console.log("Function: createProjectWithSlug");
    console.log("Args:", { slug: slug.trim().toLowerCase(), soulbound, baseURI });
    const fee = projectFee || parseEther("0.0005");
    createProject({
      address: RWA_ID_REGISTRY_ADDRESS,
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "createProjectWithSlug",
      args: [slug.trim().toLowerCase(), soulbound, baseURI],
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

  // Check if current wallet matches project admin (use on-chain data if available, fallback to stored)
  const effectiveAdmin = onChainAdmin || projectAdmin;
  const isWalletMismatch = !!(effectiveAdmin && address && effectiveAdmin.toLowerCase() !== address.toLowerCase());

  const estimateGasForSetRoot = useCallback(async () => {
    if (!projectId || !merkleRoot || !publicClient || !address) return;
    
    // Block if wallet doesn't match project admin (use on-chain admin if available)
    const adminToCheck = onChainAdmin || projectAdmin;
    if (adminToCheck && adminToCheck.toLowerCase() !== address.toLowerCase()) {
      setGasError(`Wrong wallet connected. Project admin is ${adminToCheck.slice(0, 6)}...${adminToCheck.slice(-4)}. Please switch to that wallet.`);
      return;
    }
    
    setIsEstimatingGas(true);
    setGasError(null);
    setEstimatedGas(null);
    setGasPrice(null);
    
    try {
      const fromTs = validFrom ? BigInt(validFrom) : BigInt(0);
      const toTs = validTo ? BigInt(validTo) : BigInt(0);
      
      // Encode the calldata
      const calldata = encodeFunctionData({
        abi: RWA_ID_REGISTRY_ABI,
        functionName: "setAllowlistRootForBadgeWithWindow",
        args: [projectId, BADGE_TYPE_DEFAULT, merkleRoot as `0x${string}`, fromTs, toTs],
      });
      
      // Log debug info
      console.log("=== Set Allowlist Root Debug ===");
      console.log("Contract:", RWA_ID_REGISTRY_ADDRESS);
      console.log("Function: setAllowlistRootForBadgeWithWindow");
      console.log("Args:", {
        projectId: projectId.toString(),
        badgeType: BADGE_TYPE_DEFAULT,
        merkleRoot,
        validFrom: fromTs.toString(),
        validTo: toTs.toString(),
      });
      console.log("Calldata:", calldata);
      console.log("Calldata length (bytes):", (calldata.length - 2) / 2);
      
      // Check calldata size - should be ~200 bytes, not thousands
      const calldataBytes = (calldata.length - 2) / 2;
      if (calldataBytes > 500) {
        setGasError(`Warning: Calldata is unusually large (${calldataBytes} bytes). Expected ~200 bytes.`);
        setIsEstimatingGas(false);
        return;
      }
      
      // Estimate gas
      const gasEstimate = await publicClient.estimateGas({
        account: address,
        to: RWA_ID_REGISTRY_ADDRESS,
        data: calldata,
      });
      
      console.log("Gas estimate:", gasEstimate.toString());
      
      // Check if gas is too high (> 500k is suspicious for this call)
      if (gasEstimate > BigInt(500000)) {
        setGasError(`Gas estimate is unusually high (${gasEstimate.toString()}). This may indicate a contract error. Try refreshing or contact support.`);
        setIsEstimatingGas(false);
        return;
      }
      
      // Get current gas price
      const currentGasPrice = await publicClient.getGasPrice();
      console.log("Gas price:", formatGwei(currentGasPrice), "gwei");
      
      setEstimatedGas(gasEstimate);
      setGasPrice(currentGasPrice);
      
      toast({
        title: "Gas Estimated",
        description: `~${Number(gasEstimate).toLocaleString()} gas units`,
      });
      
    } catch (error) {
      console.error("Gas estimation failed:", error);
      console.log("Connected address:", address);
      console.log("Project ID being used:", projectId?.toString());
      console.log("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Extract revert reason if available
      let revertReason = "";
      if (errorMessage.includes("reverted with the following reason:")) {
        const match = errorMessage.match(/reverted with the following reason:\s*(.+)/);
        if (match) revertReason = match[1];
      } else if (errorMessage.includes("execution reverted:")) {
        const match = errorMessage.match(/execution reverted:\s*(.+?)(\n|$)/);
        if (match) revertReason = match[1];
      }
      
      // Check for common revert reasons
      if (errorMessage.includes("execution reverted")) {
        const detailMsg = revertReason 
          ? `Contract error: ${revertReason}` 
          : `Transaction would fail. Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}, Project ID: ${projectId?.toString()}. The contract may require additional permissions or the function signature may be incorrect.`;
        setGasError(detailMsg);
      } else {
        setGasError(`Gas estimation failed: ${errorMessage}`);
      }
    } finally {
      setIsEstimatingGas(false);
    }
  }, [projectId, merkleRoot, validFrom, validTo, publicClient, address, projectAdmin, onChainAdmin, toast]);

  const handleSetAllowlistRoot = useCallback(() => {
    // HARD GUARD: Ensure we have a valid projectId - NEVER fallback to createProject
    if (!projectId || projectId === BigInt(0)) {
      console.error("handleSetAllowlistRoot BLOCKED - Project not created yet");
      toast({
        title: "Project Not Created",
        description: "Please complete Step 2 to create your project first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!merkleRoot) {
      console.error("handleSetAllowlistRoot BLOCKED - No merkle root");
      toast({
        title: "Missing Merkle Root",
        description: "Please upload a CSV in Step 3 first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!estimatedGas) {
      console.error("handleSetAllowlistRoot BLOCKED - No gas estimate");
      toast({
        title: "Gas Not Estimated",
        description: "Please wait for gas estimation to complete.",
        variant: "destructive",
      });
      return;
    }
    
    const fromTs = validFrom ? BigInt(validFrom) : BigInt(0);
    const toTs = validTo ? BigInt(validTo) : BigInt(0);
    
    // Compute selector to verify correct function is being called
    // setAllowlistRootForBadgeWithWindow(uint256,bytes32,bytes32,uint64,uint64) = 0xf1201092
    const expectedSelector = "0xf1201092";
    const calldata = encodeFunctionData({
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "setAllowlistRootForBadgeWithWindow",
      args: [projectId, BADGE_TYPE_DEFAULT, merkleRoot as `0x${string}`, fromTs, toTs],
    });
    const actualSelector = calldata.slice(0, 10);
    
    console.log("=== handleSetAllowlistRoot CALLED ===");
    console.log("Expected selector:", expectedSelector);
    console.log("Actual selector:", actualSelector);
    console.log("Selector match:", actualSelector === expectedSelector);
    console.log("Contract:", RWA_ID_REGISTRY_ADDRESS);
    console.log("Value: 0 (nonpayable)");
    console.log("Args:", {
      projectId: projectId.toString(),
      badgeType: BADGE_TYPE_DEFAULT,
      merkleRoot: merkleRoot,
      validFrom: fromTs.toString(),
      validTo: toTs.toString(),
    });
    
    if (actualSelector !== expectedSelector) {
      console.error("SELECTOR MISMATCH! Expected:", expectedSelector, "Got:", actualSelector);
      toast({
        title: "Internal Error",
        description: "Function selector mismatch. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Call setAllowlistRoot - NEVER createProject
    setAllowlistRoot({
      address: RWA_ID_REGISTRY_ADDRESS,
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "setAllowlistRootForBadgeWithWindow",
      args: [projectId, BADGE_TYPE_DEFAULT, merkleRoot as `0x${string}`, fromTs, toTs],
      gas: estimatedGas + (estimatedGas / BigInt(10)), // Add 10% buffer
    }, {
      onSuccess: () => {
        toast({
          title: "Transaction Submitted",
          description: "Setting allowlist root...",
        });
      },
      onError: (error) => {
        console.error("setAllowlistRoot transaction error:", error);
        toast({
          title: "Transaction Failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  }, [projectId, merkleRoot, validFrom, validTo, estimatedGas, setAllowlistRoot, toast]);

  
  const downloadProofsJson = useCallback(() => {
    if (!proofsData || !slugHash || !projectId) return;
    
    const proofsFile = {
      chainId: LINEA_CHAIN_ID,
      registry: RWA_ID_REGISTRY_ADDRESS,
      slug: slug.trim().toLowerCase(),
      slugHash: slugHash,
      projectId: projectId.toString(),
      badgeType: BADGE_TYPE_DEFAULT,
      merkleRoot: merkleRoot,
      validFrom: validFrom || "0",
      validTo: validTo || "0",
      entries: proofsData,
    };
    
    const blob = new Blob([JSON.stringify(proofsFile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `allowlist_proofs_${slug}_project${projectId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Proofs Downloaded",
      description: "Host this file on your servers for users to claim.",
    });
  }, [proofsData, slugHash, projectId, slug, merkleRoot, validFrom, validTo, toast]);

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
      // Store the wallet that created the project
      if (address && !projectAdmin) {
        setProjectAdmin(address);
      }
      
      let attempts = 0;
      const maxAttempts = 10;
      
      const fetchId = async () => {
        try {
          const result = await refetchProjectId();
          if (result.data && result.data > BigInt(0)) {
            setProjectId(result.data);
            return true;
          }
        } catch {
          // Retry on error
        }
        return false;
      };
      
      const retryFetch = async () => {
        const success = await fetchId();
        if (!success && attempts < maxAttempts) {
          attempts++;
          setTimeout(retryFetch, 2000);
        } else if (!success) {
          toast({
            title: "Could not verify project",
            description: "Please refresh the page and try again.",
            variant: "destructive",
          });
        }
      };
      
      const timer = setTimeout(retryFetch, 1500);
      return () => clearTimeout(timer);
    }
  }, [createSuccess, projectId, slug, refetchProjectId, toast, address, projectAdmin]);

  // Auto-estimate gas when entering step 3 with all required data
  useEffect(() => {
    if (currentStep === 3 && projectId && merkleRoot && publicClient && address && !estimatedGas && !isEstimatingGas && !gasError) {
      estimateGasForSetRoot();
    }
  }, [currentStep, projectId, merkleRoot, publicClient, address, estimatedGas, isEstimatingGas, gasError, estimateGasForSetRoot]);

  // Re-estimate when validFrom/validTo change
  useEffect(() => {
    if (currentStep === 3 && projectId && merkleRoot && estimatedGas) {
      // Reset estimation when time window changes
      setEstimatedGas(null);
      setGasPrice(null);
      setGasError(null);
    }
  }, [validFrom, validTo]);

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
                    {projectFee ? `${formatEther(projectFee)} ETH` : "~0.0005 ETH"}
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
              {/* Debug info - remove after fixing */}
              <div className="p-2 rounded bg-yellow-100 dark:bg-yellow-900/20 text-xs font-mono space-y-1">
                <p>DEBUG: Step={currentStep}, ProjectID={projectId?.toString() || 'null'}</p>
                <p>estimatedGas={estimatedGas?.toString() || 'null'}, isSettingRoot={isSettingRoot.toString()}</p>
                <p>Button disabled: {(!merkleRoot || !projectId || !estimatedGas || isSettingRoot || isWaitingSetRoot || setRootSuccess || isWalletMismatch).toString()}</p>
              </div>
              
              {/* Wallet mismatch warning */}
              {isWalletMismatch && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-destructive">
                      <p className="font-medium">Wrong wallet connected</p>
                      <p className="text-xs mt-1">
                        Project admin is {effectiveAdmin?.slice(0, 6)}...{effectiveAdmin?.slice(-4)}. 
                        Please switch to that wallet to set the allowlist root.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Project ID</span>
                  <span className="font-mono font-medium">
                    {projectId ? projectId.toString() : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Fetching...
                      </span>
                    )}
                  </span>
                </div>
                {onChainAdmin && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Project Admin</span>
                    <span className="font-mono text-xs">{onChainAdmin.slice(0, 6)}...{onChainAdmin.slice(-4)}</span>
                  </div>
                )}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From (Unix timestamp)</Label>
                  <Input
                    id="validFrom"
                    type="number"
                    placeholder="0"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    disabled={isSettingRoot || isWaitingSetRoot}
                    data-testid="input-valid-from"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validTo">Valid To (Unix timestamp)</Label>
                  <Input
                    id="validTo"
                    type="number"
                    placeholder="0"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    disabled={isSettingRoot || isWaitingSetRoot}
                    data-testid="input-valid-to"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave both as 0 for no time restrictions. Use Unix timestamps for specific windows.
              </p>
              
              {/* Gas Estimation Status (auto-runs) */}
              {!setRootSuccess && (
                <>
                  {isEstimatingGas && (
                    <div className="p-4 rounded-lg bg-muted flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Estimating transaction cost...</span>
                    </div>
                  )}
                  
                  {gasError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm text-destructive">{gasError}</p>
                          <Button
                            onClick={estimateGasForSetRoot}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            data-testid="button-retry-estimate"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {estimatedGas !== null && gasPrice !== null && (
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Est. Cost</span>
                        <span className="font-mono font-medium">
                          ~{formatEther(estimatedGas * gasPrice).slice(0, 10)} ETH
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <Button
                onClick={handleSetAllowlistRoot}
                disabled={!merkleRoot || !projectId || !estimatedGas || isSettingRoot || isWaitingSetRoot || setRootSuccess || isWalletMismatch}
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
              {proofsData && (
                <Button
                  onClick={downloadProofsJson}
                  variant="outline"
                  className="w-full"
                  data-testid="button-download-proofs"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Proofs JSON
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Host the proofs JSON on your servers. Users will need this to claim their identities.
              </p>
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
                  setProofsData(null);
                  setValidFrom("0");
                  setValidTo("0");
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
