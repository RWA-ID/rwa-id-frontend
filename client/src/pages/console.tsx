import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain, usePublicClient, useChainId } from "wagmi";
import { keccak256, toBytes, formatEther, encodeFunctionData, formatGwei } from "viem";
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
import { rwaIdV2Abi, RWAID_V2_ADDRESS, CHAIN_ID } from "@/lib/abi";
import { apiRequest } from "@/lib/queryClient";
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

const STEPS_NEW = ["Connect", "Create Project", "Upload CSV", "Set Root", "Complete"];
const STEPS_EXISTING = ["Connect", "Upload CSV", "Set Root", "Complete"];

export default function Platform() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId(); // Get actual chain ID from wallet
  const { switchChain } = useSwitchChain();
  
  // Check if on wrong network - use chainId hook which works even for unsupported chains
  // chain.id may be undefined if wallet is on unsupported chain, but chainId from useChainId() returns actual ID
  const actualChainId = chain?.id ?? chainId;
  const isWrongNetwork = isConnected && actualChainId !== CHAIN_ID;
  
  // Track if we've already prompted for network switch to avoid spamming
  const hasPromptedNetworkSwitch = useRef(false);
  
  // Auto-prompt wallet to switch to Ethereum when connected to wrong network
  useEffect(() => {
    if (isWrongNetwork && switchChain && !hasPromptedNetworkSwitch.current) {
      hasPromptedNetworkSwitch.current = true;
      console.log("Auto-prompting wallet to switch to Ethereum. Current chain:", actualChainId, "(chain.id:", chain?.id, "chainId hook:", chainId, ")");
      
      // Small delay to let wallet UI settle
      const timer = setTimeout(() => {
        switchChain(
          { chainId: CHAIN_ID },
          {
            onSuccess: () => {
              console.log("Successfully switched to Ethereum!");
            },
            onError: (error) => {
              console.error("Failed to switch network:", error);
            },
          }
        );
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Reset the flag when user disconnects or switches to correct network
    if (!isConnected || actualChainId === CHAIN_ID) {
      hasPromptedNetworkSwitch.current = false;
    }
  }, [isWrongNetwork, switchChain, actualChainId, chain, chainId, isConnected]);

  const [currentStep, setCurrentStep] = useState(0);
  const [slug, setSlug] = useState("");
  const [treasury, setTreasury] = useState("");
  const [claimFee, setClaimFee] = useState("0");
  const [transferable, setTransferable] = useState(false);
  const [projectId, setProjectId] = useState<bigint | null>(null);
  const [csvText, setCsvText] = useState("");
  const [merkleRoot, setMerkleRoot] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [proofsData, setProofsData] = useState<Record<string, { name: string; nameHash: string; proof: string[] }> | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [gasError, setGasError] = useState<string | null>(null);
  const [projectAdmin, setProjectAdmin] = useState<string | null>(null);
  
  // Existing project detection
  const [isExistingProject, setIsExistingProject] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugCheckError, setSlugCheckError] = useState<string | null>(null);
  const [slugVerified, setSlugVerified] = useState(false);
  
  // Auto-discovered projects for connected wallet
  const [userProjects, setUserProjects] = useState<Array<{
    projectId: bigint;
    slug: string;
    transferable: boolean;
  }>>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Get the appropriate steps based on whether it's an existing project
  const STEPS = isExistingProject ? STEPS_EXISTING : STEPS_NEW;

  const publicClient = usePublicClient();

  const slugHash = slug ? keccak256(toBytes(slug.trim().toLowerCase())) : undefined;

  const { writeContract: createProject, data: createTxHash, isPending: isCreating, reset: resetCreateProject } = useWriteContract();
  const { isLoading: isWaitingCreate, isSuccess: createSuccess, data: createReceipt } = useWaitForTransactionReceipt({
    hash: createTxHash,
    query: {
      enabled: !!createTxHash,
    },
  });

  const { writeContract: updateMerkleRoot, data: setRootTxHash, isPending: isSettingRoot, reset: resetSetRoot, error: setRootError } = useWriteContract();
  const { isLoading: isWaitingSetRoot, isSuccess: setRootSuccess, error: receiptError, status: receiptStatus } = useWaitForTransactionReceipt({
    hash: setRootTxHash,
    query: {
      enabled: !!setRootTxHash,
    },
  });
  
  // Track transaction wait timeout
  const [txWaitTimeout, setTxWaitTimeout] = useState(false);
  const txWaitStartTime = useRef<number | null>(null);
  
  // Debug: Monitor setRoot transaction state
  useEffect(() => {
    console.log("=== SetRoot State Debug ===");
    console.log("setRootTxHash:", setRootTxHash);
    console.log("isSettingRoot:", isSettingRoot);
    console.log("isWaitingSetRoot:", isWaitingSetRoot);
    console.log("setRootSuccess:", setRootSuccess);
    console.log("receiptStatus:", receiptStatus);
    console.log("setRootError:", setRootError);
    console.log("receiptError:", receiptError);
  }, [setRootTxHash, isSettingRoot, isWaitingSetRoot, setRootSuccess, receiptStatus, setRootError, receiptError]);
  
  // Detect stuck transactions with timeout
  useEffect(() => {
    if (setRootTxHash && isWaitingSetRoot && !setRootSuccess) {
      // Start tracking time
      if (!txWaitStartTime.current) {
        txWaitStartTime.current = Date.now();
      }
      
      // Set up interval to check timeout
      const interval = setInterval(() => {
        if (txWaitStartTime.current) {
          const elapsed = Date.now() - txWaitStartTime.current;
          if (elapsed > 60000 && !txWaitTimeout) {
            console.warn("Transaction wait timeout - may have been dropped");
            setTxWaitTimeout(true);
          }
        }
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(interval);
    } else if (setRootSuccess || !setRootTxHash) {
      txWaitStartTime.current = null;
      if (txWaitTimeout) setTxWaitTimeout(false);
    }
  }, [setRootTxHash, isWaitingSetRoot, setRootSuccess, txWaitTimeout]);
  
  // Reset stuck transaction
  const handleResetTransaction = useCallback(() => {
    resetSetRoot();
    txWaitStartTime.current = null;
    setTxWaitTimeout(false);
  }, [resetSetRoot]);
  
  // Reset createProject mutation when moving to step 3 to prevent stale transactions
  useEffect(() => {
    if (currentStep === 3 && createSuccess) {
      // Clear any pending createProject state to avoid confusion
      console.log("Resetting createProject mutation state for step 3");
    }
  }, [currentStep, createSuccess]);

  // Fetch on-chain project data to verify ownership
  const { data: projectData } = useReadContract({
    address: RWAID_V2_ADDRESS,
    abi: rwaIdV2Abi,
    functionName: "projects",
    args: projectId ? [projectId] : undefined,
    query: {
      enabled: !!projectId,
    },
  });
  
  // Extract owner from project data (projects returns [owner, slug, slugHash, treasury, claimFee, transferable, merkleRoot, active, totalClaimed, totalRevenue])
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
    },
    onError: (error) => {
      console.error("Upload failed:", error instanceof Error ? error.message : "Failed to process CSV");
    },
  });

  // Check if slug exists and verify owner
  const checkSlugAndOwnership = useCallback(async () => {
    if (!slug || !publicClient || !address) return;
    
    setIsCheckingSlug(true);
    setSlugCheckError(null);
    setSlugVerified(false);
    
    try {
      const normalizedSlug = slug.trim().toLowerCase();
      const computedSlugHash = keccak256(toBytes(normalizedSlug));
      
      console.log("Checking slug:", normalizedSlug, "Hash:", computedSlugHash);
      
      // Scan projects to find one with matching slugHash
      let foundProjectId: bigint | null = null;
      const maxProjectsToCheck = 50;
      let consecutiveErrors = 0;
      
      for (let i = 1; i <= maxProjectsToCheck; i++) {
        try {
          const projectInfo = await publicClient.readContract({
            address: RWAID_V2_ADDRESS,
            abi: rwaIdV2Abi,
            functionName: "projects",
            args: [BigInt(i)],
          }) as readonly [string, string, string, string, bigint, boolean, string, boolean, bigint, bigint];
          // [owner, slug, slugHash, treasury, claimFee, transferable, merkleRoot, active, totalClaimed, totalRevenue]
          
          consecutiveErrors = 0;
          
          if (projectInfo[2] === computedSlugHash) {
            foundProjectId = BigInt(i);
            const owner = projectInfo[0];
            const isTransferable = projectInfo[5];
            
            if (owner.toLowerCase() === address.toLowerCase()) {
              setProjectId(foundProjectId);
              setProjectAdmin(owner);
              setTransferable(isTransferable);
              setIsExistingProject(true);
              setSlugVerified(true);
            } else {
              setSlugCheckError(`This slug is owned by ${owner.slice(0, 6)}...${owner.slice(-4)}. Please use a different slug or switch wallets.`);
            }
            break;
          }
        } catch {
          consecutiveErrors++;
          if (consecutiveErrors >= 3) break;
        }
      }
      
      if (foundProjectId === null) {
        // Project doesn't exist - new project flow
        setIsExistingProject(false);
        setSlugVerified(true);
        setProjectId(null);
        setProjectAdmin(null);
        setEstimatedGas(null);
        setGasPrice(null);
        setGasError(null);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Slug check failed:", errorMessage);
      
      if (errorMessage.includes("fetch") || errorMessage.includes("network") || errorMessage.includes("Failed to fetch")) {
        setSlugCheckError("Network error. Please check your connection and try again.");
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        setSlugCheckError("RPC rate limited. Please wait a moment and try again.");
      } else if (errorMessage.includes("timeout")) {
        setSlugCheckError("Request timed out. Please try again.");
      } else {
        setSlugCheckError(`Check failed: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setIsCheckingSlug(false);
    }
  }, [slug, publicClient, address]);

  // Fetch all projects owned by the connected wallet
  const fetchUserProjects = useCallback(async () => {
    if (!publicClient || !address) return;
    
    setIsLoadingProjects(true);
    try {
      const projects: Array<{ projectId: bigint; slug: string; transferable: boolean }> = [];
      const maxProjectsToCheck = 50;
      
      console.log("Scanning for projects owned by:", address);
      
      let consecutiveErrors = 0;
      for (let i = 1; i <= maxProjectsToCheck; i++) {
        try {
          const projectInfo = await publicClient.readContract({
            address: RWAID_V2_ADDRESS,
            abi: rwaIdV2Abi,
            functionName: "projects",
            args: [BigInt(i)],
          }) as readonly [string, string, string, string, bigint, boolean, string, boolean, bigint, bigint];
          // [owner, slug, slugHash, treasury, claimFee, transferable, merkleRoot, active, totalClaimed, totalRevenue]
          
          consecutiveErrors = 0;
          
          if (projectInfo[0] && projectInfo[0].toLowerCase() === address.toLowerCase()) {
            console.log(`Found project ${i}:`, projectInfo[1]);
            projects.push({
              projectId: BigInt(i),
              slug: projectInfo[1],
              transferable: projectInfo[5],
            });
          }
        } catch (err) {
          consecutiveErrors++;
          console.log(`Error reading project ${i}:`, err instanceof Error ? err.message.slice(0, 100) : "Unknown error");
          if (consecutiveErrors >= 3) {
            console.log(`Stopped scanning after ${i} projects (3 consecutive errors)`);
            break;
          }
        }
      }
      
      console.log("Total projects found for user:", projects.length);
      setUserProjects(projects);
      
    } catch (error) {
      console.error("Failed to fetch user projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [publicClient, address]);

  // Auto-fetch user's projects when wallet connects
  useEffect(() => {
    if (isConnected && address && publicClient && !isWrongNetwork) {
      fetchUserProjects();
    }
  }, [isConnected, address, publicClient, isWrongNetwork, fetchUserProjects]);

  // Select an existing project from the list
  const selectProject = useCallback((project: { projectId: bigint; slug: string; transferable: boolean }) => {
    setSlug(project.slug);
    setProjectId(project.projectId);
    setTransferable(project.transferable);
    setIsExistingProject(true);
    setSlugVerified(true);
    setProjectAdmin(address || null);
    
  }, [address]);

  const handleCreateProject = useCallback(() => {
    if (!slug || !address) return;
    
    if (actualChainId !== CHAIN_ID) {
      console.error("handleCreateProject BLOCKED - Wrong network! Connected to:", actualChainId, "Expected:", CHAIN_ID);
      if (switchChain) {
        switchChain(
          { chainId: CHAIN_ID },
          {
            onSuccess: () => console.log("Network switched to Ethereum"),
            onError: (error) => console.error("Network switch failed:", error),
          }
        );
      }
      return;
    }
    
    const treasuryAddr = treasury || address;
    const parsedFee = parseFloat(claimFee || "0");
    const feeUsdcUnits = BigInt(Math.max(0, Math.round((isNaN(parsedFee) ? 0 : parsedFee) * 1_000_000)));
    
    console.log("=== handleCreateProject CALLED ===");
    console.log("Function: createProject");
    console.log("Args:", { slug: slug.trim().toLowerCase(), treasury: treasuryAddr, claimFee: feeUsdcUnits.toString(), transferable });
    
    createProject({
      address: RWAID_V2_ADDRESS,
      abi: rwaIdV2Abi,
      functionName: "createProject",
      args: [slug.trim().toLowerCase(), treasuryAddr as `0x${string}`, feeUsdcUnits, transferable],
      chainId: CHAIN_ID,
    }, {
      onSuccess: () => console.log("Create project transaction submitted"),
      onError: (error) => console.error("Create project transaction failed:", error.message),
    });
  }, [slug, treasury, claimFee, transferable, address, createProject, actualChainId, switchChain]);

  // Check if current wallet matches project admin (use on-chain data if available, fallback to stored)
  const effectiveAdmin = onChainAdmin || projectAdmin;
  const isWalletMismatch = !!(effectiveAdmin && address && effectiveAdmin.toLowerCase() !== address.toLowerCase());

  // Use on-chain admin if available, otherwise fall back to stored admin from createProject
  const adminToVerify = onChainAdmin || projectAdmin;
  
  const estimateGasForSetRoot = useCallback(async () => {
    if (!projectId || !merkleRoot || !publicClient || !address) return;
    
    const admin = onChainAdmin || projectAdmin;
    
    if (admin && admin.toLowerCase() !== address.toLowerCase()) {
      const shortAdmin = `${admin.slice(0, 6)}...${admin.slice(-4)}`;
      setGasError(`Wrong wallet. Project owner is ${shortAdmin}. Please switch wallets.`);
      console.error("Wallet mismatch - Connected:", address, "Owner:", admin);
      return;
    }
    
    setIsEstimatingGas(true);
    setGasError(null);
    setEstimatedGas(null);
    setGasPrice(null);
    
    try {
      const calldata = encodeFunctionData({
        abi: rwaIdV2Abi,
        functionName: "updateMerkleRoot",
        args: [projectId, merkleRoot as `0x${string}`, BigInt(rowCount)],
      });
      
      console.log("=== Update Merkle Root Debug ===");
      console.log("Contract:", RWAID_V2_ADDRESS);
      console.log("Function: updateMerkleRoot");
      console.log("Args:", {
        projectId: projectId.toString(),
        newRoot: merkleRoot,
        newTotalAllowlisted: rowCount.toString(),
      });
      console.log("Calldata:", calldata);
      
      const calldataBytes = (calldata.length - 2) / 2;
      if (calldataBytes > 500) {
        setGasError(`Warning: Calldata is unusually large (${calldataBytes} bytes). Expected ~100 bytes.`);
        setIsEstimatingGas(false);
        return;
      }
      
      const gasEstimate = await publicClient.estimateGas({
        account: address,
        to: RWAID_V2_ADDRESS,
        data: calldata,
      });
      
      console.log("Gas estimate:", gasEstimate.toString());
      
      if (gasEstimate > BigInt(500000)) {
        setGasError(`Gas estimate is unusually high (${gasEstimate.toString()}). This may indicate a contract error.`);
        setIsEstimatingGas(false);
        return;
      }
      
      const currentGasPrice = await publicClient.getGasPrice();
      console.log("Gas price:", formatGwei(currentGasPrice), "gwei");
      
      setEstimatedGas(gasEstimate);
      setGasPrice(currentGasPrice);
      
    } catch (error) {
      console.error("Gas estimation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      let revertReason = "";
      if (errorMessage.includes("execution reverted:")) {
        const match = errorMessage.match(/execution reverted:\s*(.+?)(\n|$)/);
        if (match) revertReason = match[1];
      }
      
      if (errorMessage.includes("execution reverted")) {
        setGasError(revertReason 
          ? `Contract error: ${revertReason}` 
          : `Transaction would fail. Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}, Project ID: ${projectId?.toString()}.`);
      } else {
        setGasError(`Gas estimation failed: ${errorMessage}`);
      }
    } finally {
      setIsEstimatingGas(false);
    }
  }, [projectId, merkleRoot, rowCount, publicClient, address, projectAdmin, onChainAdmin]);

  const handleSetAllowlistRoot = useCallback(() => {
    if (actualChainId !== CHAIN_ID) {
      if (switchChain) {
        switchChain(
          { chainId: CHAIN_ID },
          {
            onSuccess: () => console.log("Network switched to Ethereum"),
            onError: (error) => console.error("Network switch failed:", error),
          }
        );
      }
      return;
    }
    
    if (!projectId || projectId === BigInt(0)) {
      console.error("handleSetAllowlistRoot BLOCKED - Project not created yet");
      return;
    }
    
    if (!merkleRoot || !estimatedGas) return;
    
    console.log("=== handleSetAllowlistRoot CALLED ===");
    console.log("Contract:", RWAID_V2_ADDRESS);
    console.log("Function: updateMerkleRoot");
    console.log("Args:", {
      projectId: projectId.toString(),
      newRoot: merkleRoot,
      newTotalAllowlisted: rowCount.toString(),
    });
    
    updateMerkleRoot({
      address: RWAID_V2_ADDRESS,
      abi: rwaIdV2Abi,
      functionName: "updateMerkleRoot",
      args: [projectId, merkleRoot as `0x${string}`, BigInt(rowCount)],
      gas: estimatedGas + (estimatedGas / BigInt(10)),
      chainId: CHAIN_ID,
    }, {
      onSuccess: (hash) => {
        console.log("updateMerkleRoot tx hash:", hash);
      },
      onError: (error) => {
        console.error("updateMerkleRoot transaction error:", error);
      },
    });
  }, [projectId, merkleRoot, rowCount, estimatedGas, updateMerkleRoot, actualChainId, switchChain]);

  
  const downloadProofsJson = useCallback(() => {
    if (!proofsData || !slugHash || !projectId) return;
    
    const proofsFile = {
      chainId: CHAIN_ID,
      registry: RWAID_V2_ADDRESS,
      slug: slug.trim().toLowerCase(),
      slugHash: slugHash,
      projectId: projectId.toString(),
      merkleRoot: merkleRoot,
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
    
  }, [proofsData, slugHash, projectId, slug, merkleRoot]);

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
    if (isExistingProject) {
      // Existing project flow: Connect → Upload CSV → Set Root → Complete
      switch (currentStep) {
        case 0:
          return isConnected && !isWrongNetwork && slugVerified && isExistingProject;
        case 1: // Upload CSV
          return !!merkleRoot;
        case 2: // Set Root
          return setRootSuccess;
        default:
          return true;
      }
    } else {
      // New project flow: Connect → Create Project → Upload CSV → Set Root → Complete
      switch (currentStep) {
        case 0:
          return isConnected && !isWrongNetwork && slugVerified && !isExistingProject;
        case 1:
          return createSuccess && projectId !== null;
        case 2:
          return !!merkleRoot;
        case 3:
          return setRootSuccess;
        default:
          return true;
      }
    }
  };

  useEffect(() => {
    if (createSuccess && projectId === null && slug && publicClient) {
      if (address && !projectAdmin) {
        setProjectAdmin(address);
      }
      
      let attempts = 0;
      const maxAttempts = 10;
      const normalizedSlug = slug.trim().toLowerCase();
      const computedSlugHash = keccak256(toBytes(normalizedSlug));
      
      const fetchId = async () => {
        // Scan projects to find the newly created one
        let consecutiveErrors = 0;
        for (let i = 1; i <= 100; i++) {
          try {
            const projectInfo = await publicClient.readContract({
              address: RWAID_V2_ADDRESS,
              abi: rwaIdV2Abi,
              functionName: "projects",
              args: [BigInt(i)],
            }) as readonly [string, string, string, string, bigint, boolean, string, boolean, bigint, bigint];
            
            consecutiveErrors = 0;
            if (projectInfo[2] === computedSlugHash) {
              setProjectId(BigInt(i));
              return true;
            }
          } catch {
            consecutiveErrors++;
            if (consecutiveErrors >= 3) break;
          }
        }
        return false;
      };
      
      const retryFetch = async () => {
        const success = await fetchId();
        if (!success && attempts < maxAttempts) {
          attempts++;
          setTimeout(retryFetch, 2000);
        } else if (!success) {
          console.error("Could not verify project - please refresh the page and try again");
        }
      };
      
      const timer = setTimeout(retryFetch, 1500);
      return () => clearTimeout(timer);
    }
  }, [createSuccess, projectId, slug, publicClient, address, projectAdmin]);

  // Auto-estimate gas when entering setroot step with all required data
  useEffect(() => {
    const logicalStep = isExistingProject 
      ? ["connect", "upload", "setroot", "complete"][currentStep] 
      : ["connect", "create", "upload", "setroot", "complete"][currentStep];
    
    if (logicalStep === "setroot" && projectId && merkleRoot && publicClient && address && !estimatedGas && !isEstimatingGas && !gasError) {
      estimateGasForSetRoot();
    }
  }, [currentStep, isExistingProject, projectId, merkleRoot, publicClient, address, estimatedGas, isEstimatingGas, gasError, estimateGasForSetRoot]);

  // Map current step to logical step based on flow type
  const getLogicalStep = () => {
    if (isExistingProject) {
      // Existing: 0=Connect, 1=Upload, 2=SetRoot, 3=Complete
      const map = ["connect", "upload", "setroot", "complete"];
      return map[currentStep] || "connect";
    } else {
      // New: 0=Connect, 1=Create, 2=Upload, 3=SetRoot, 4=Complete
      const map = ["connect", "create", "upload", "setroot", "complete"];
      return map[currentStep] || "connect";
    }
  };

  const renderStepContent = () => {
    const logicalStep = getLogicalStep();
    
    if (logicalStep === "connect") {
      return (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-2xl">Connect & Select Project</CardTitle>
              <CardDescription>
                Connect your wallet and enter your project slug
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="w-8 h-8 text-primary" />
                </div>
                <WalletButton />
                {isWrongNetwork && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Please switch to Ethereum Mainnet
                  </div>
                )}
                {isConnected && !isWrongNetwork && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Connected to Ethereum Mainnet
                  </div>
                )}
              </div>
              
              {isConnected && !isWrongNetwork && (
                <>
                  {/* Display discovered projects */}
                  {isLoadingProjects && (
                    <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading your projects...</span>
                    </div>
                  )}
                  
                  {!isLoadingProjects && userProjects.length > 0 && (
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Your Projects ({userProjects.length})</span>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        {userProjects.map((project) => (
                          <Button
                            key={project.projectId.toString()}
                            variant={slug === project.slug && isExistingProject ? "default" : "outline"}
                            className="justify-start gap-2 h-auto py-3"
                            onClick={() => selectProject(project)}
                            data-testid={`button-select-project-${project.slug}`}
                          >
                            <Fingerprint className="h-4 w-4 flex-shrink-0" />
                            <div className="text-left">
                              <div className="font-medium">{project.slug}.rwa-id.eth</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {project.projectId.toString()} · {project.transferable ? "Transferable" : "Soulbound"}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        {userProjects.length > 0 ? "Or Enter a New Slug" : "Enter Project Slug"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug-check">Project Slug</Label>
                    <div className="flex gap-2">
                      <Input
                        id="slug-check"
                        placeholder="e.g., testproject2025"
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                          setSlugVerified(false);
                          setSlugCheckError(null);
                          setIsExistingProject(false);
                          // Clear project state when slug changes to prevent stale data
                          setProjectId(null);
                          setProjectAdmin(null);
                          setEstimatedGas(null);
                          setGasPrice(null);
                          setGasError(null);
                        }}
                        disabled={isCheckingSlug}
                        data-testid="input-slug-check"
                      />
                      <Button
                        onClick={checkSlugAndOwnership}
                        disabled={!slug || isCheckingSlug || !publicClient}
                        data-testid="button-check-slug"
                      >
                        {isCheckingSlug ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : !publicClient ? (
                          "Connecting..."
                        ) : (
                          "Check"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter an existing slug to update its allowlist, or a new slug to create a project
                    </p>
                  </div>
                  
                  {slugCheckError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-destructive">{slugCheckError}</p>
                      </div>
                    </div>
                  )}
                  
                  {slugVerified && isExistingProject && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            Existing Project Found
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Project ID: {projectId?.toString()} - You can upload a new CSV to update the allowlist (no platform fee required)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {slugVerified && !isExistingProject && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-700 dark:text-blue-400">
                            Slug Available
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            "{slug}.rwa-id.eth" is available. You'll create a new project in the next step.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
    }
    
    if (logicalStep === "create") {
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
                <Label htmlFor="treasury">Treasury Address</Label>
                <Input
                  id="treasury"
                  placeholder="0x... (defaults to your wallet)"
                  value={treasury}
                  onChange={(e) => setTreasury(e.target.value)}
                  disabled={isCreating || isWaitingCreate}
                  data-testid="input-treasury"
                />
                <p className="text-xs text-muted-foreground">
                  Address that receives claim fees. Defaults to your connected wallet.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimFee">Claim Fee (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="claimFee"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={claimFee}
                    onChange={(e) => setClaimFee(e.target.value)}
                    disabled={isCreating || isWaitingCreate}
                    className="pl-7"
                    data-testid="input-claim-fee"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Fee in USD paid in USDC per claim. Set to 0 for free claims.
                  {claimFee && parseFloat(claimFee) > 0 && (
                    <span className="block mt-1 font-mono">
                      = {Math.round(parseFloat(claimFee) * 1_000_000).toLocaleString()} USDC units (6 decimals)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="transferable">Transferable Tokens</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow identity tokens to be transferred between wallets
                  </p>
                </div>
                <Switch
                  id="transferable"
                  checked={transferable}
                  onCheckedChange={setTransferable}
                  disabled={isCreating || isWaitingCreate}
                  data-testid="switch-transferable"
                />
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
              {createSuccess && projectId && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        Project ID: {projectId.toString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This ID will be used in the next step to set the Merkle root
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {createSuccess && !projectId && (
                <div className="p-4 rounded-lg bg-muted flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Fetching project ID from chain...</span>
                </div>
              )}
              {createTxHash && (
                <a
                  href={`https://etherscan.io/tx/${createTxHash}`}
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
    }
    
    if (logicalStep === "upload") {
      return (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Upload Allowlist</CardTitle>
              <CardDescription>
                Upload a CSV with name and address columns to generate the Merkle tree
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectIdInput">Project ID</Label>
                <Input
                  id="projectIdInput"
                  type="number"
                  min="1"
                  placeholder="Enter project ID"
                  value={projectId ? projectId.toString() : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProjectId(val ? BigInt(val) : null);
                    setEstimatedGas(null);
                    setGasPrice(null);
                    setGasError(null);
                  }}
                  disabled={!!merkleRoot}
                  data-testid="input-project-id"
                />
                <p className="text-xs text-muted-foreground">
                  {isExistingProject 
                    ? "Auto-filled from your selected project. You can change it if needed."
                    : "Auto-filled from project creation. This is the on-chain project ID returned by the contract."
                  }
                </p>
              </div>
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
    }
    
    if (logicalStep === "setroot") {
      return (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Update Merkle Root</CardTitle>
              <CardDescription>
                Submit the Merkle root on-chain to enable claims
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isWalletMismatch && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-destructive">
                      <p className="font-medium">Wrong wallet connected</p>
                      <p className="text-xs mt-1">
                        Project owner is {effectiveAdmin?.slice(0, 6)}...{effectiveAdmin?.slice(-4)}. 
                        Please switch to that wallet to update the Merkle root.
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
                    <span className="text-muted-foreground">Project Owner</span>
                    <span className="font-mono text-xs">{onChainAdmin.slice(0, 6)}...{onChainAdmin.slice(-4)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entries</span>
                  <span className="font-medium">{rowCount}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Merkle Root</span>
                  <p className="font-mono text-xs break-all bg-background p-2 rounded">
                    {merkleRoot}
                  </p>
                </div>
              </div>
              
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
              
              {txWaitTimeout && isWaitingSetRoot ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-destructive">Transaction may have been dropped</p>
                        <p className="text-xs text-muted-foreground">
                          The transaction was sent but hasn't been confirmed. This can happen due to network issues. 
                          You can reset and try again, or check your wallet for the pending transaction.
                        </p>
                        {setRootTxHash && (
                          <a
                            href={`https://etherscan.io/tx/${setRootTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Check on Etherscan <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleResetTransaction}
                    variant="outline"
                    className="w-full"
                    data-testid="button-reset-tx"
                  >
                    Reset and Try Again
                  </Button>
                </div>
              ) : (
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
                    "Update Merkle Root"
                  )}
                </Button>
              )}
              
              {setRootTxHash && (
                <a
                  href={`https://etherscan.io/tx/${setRootTxHash}`}
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
    }
    
    if (logicalStep === "complete") {
      return (
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <CardTitle className="font-heading text-2xl">{isExistingProject ? "Allowlist Updated!" : "Project Created!"}</CardTitle>
              <CardDescription>
                Your RWA-ID namespace is now live on Ethereum
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
                  setIsExistingProject(false);
                  setSlugVerified(false);
                  setSlugCheckError(null);
                  setProjectAdmin(null);
                  setEstimatedGas(null);
                  setGasPrice(null);
                  setGasError(null);
                  // Refresh user projects list
                  fetchUserProjects();
                }}
                data-testid="button-create-another"
              >
                Create Another Project
              </Button>
            </CardContent>
          </Card>
        );
    }
    
    return null;
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
