import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain, usePublicClient } from "wagmi";
import { linea } from "wagmi/chains";
import { keccak256, toBytes, parseEther, formatEther, encodeFunctionData, formatGwei, parseAbiItem } from "viem";
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

const STEPS_NEW = ["Connect", "Create Project", "Upload CSV", "Set Root", "Complete"];
const STEPS_EXISTING = ["Connect", "Upload CSV", "Set Root", "Complete"];

export default function Platform() {
  const { toast } = useToast();
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  // Only show wrong network if chain is defined and it's not Linea
  const isWrongNetwork = isConnected && chain !== undefined && chain.id !== LINEA_CHAIN_ID;

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
  // Default to max uint64 (effectively no expiration)
  const [validTo, setValidTo] = useState("18446744073709551615");
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
    soulbound: boolean;
  }>>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Get the appropriate steps based on whether it's an existing project
  const STEPS = isExistingProject ? STEPS_EXISTING : STEPS_NEW;

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
  
  // Extract admin from project data (projects returns [admin, soulbound, paused, slugHash, slug, baseURI])
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

  // Check if slug exists and verify admin ownership
  const checkSlugAndOwnership = useCallback(async () => {
    if (!slug || !publicClient || !address) return;
    
    setIsCheckingSlug(true);
    setSlugCheckError(null);
    setSlugVerified(false);
    
    try {
      const normalizedSlug = slug.trim().toLowerCase();
      const computedSlugHash = keccak256(toBytes(normalizedSlug));
      
      console.log("Checking slug:", normalizedSlug, "Hash:", computedSlugHash);
      
      // Check if project exists - use raw call to handle potential ABI issues
      let existingProjectId: bigint;
      try {
        existingProjectId = await publicClient.readContract({
          address: RWA_ID_REGISTRY_ADDRESS,
          abi: RWA_ID_REGISTRY_ABI,
          functionName: "projectIdBySlugHash",
          args: [computedSlugHash],
        }) as bigint;
        console.log("Project ID lookup result:", existingProjectId?.toString());
      } catch (lookupError) {
        console.error("Project ID lookup failed:", lookupError);
        // If lookup fails, assume slug is available
        setIsExistingProject(false);
        setSlugVerified(true);
        setProjectId(null);
        setProjectAdmin(null);
        toast({
          title: "Slug Available",
          description: `"${normalizedSlug}.rwa-id.eth" appears to be available.`,
        });
        return;
      }
      
      if (existingProjectId && existingProjectId > BigInt(0)) {
        // Project exists - check admin ownership
        let projectInfo: readonly [string, boolean, boolean, string, string, string];
        try {
          projectInfo = await publicClient.readContract({
            address: RWA_ID_REGISTRY_ADDRESS,
            abi: RWA_ID_REGISTRY_ABI,
            functionName: "projects",
            args: [existingProjectId],
          }) as readonly [string, boolean, boolean, string, string, string];
          console.log("Project info:", projectInfo);
        } catch (projectError) {
          console.error("Project info lookup failed:", projectError);
          setSlugCheckError("Could not fetch project details. Please try again.");
          return;
        }
        
        const admin = projectInfo[0];
        const isSoulbound = projectInfo[1];
        
        if (admin.toLowerCase() === address.toLowerCase()) {
          // User owns this project - set up for existing project flow
          setProjectId(existingProjectId);
          setProjectAdmin(admin);
          setSoulbound(isSoulbound);
          setIsExistingProject(true);
          setSlugVerified(true);
          
          toast({
            title: "Project Found",
            description: `You own "${normalizedSlug}.rwa-id.eth" (ID: ${existingProjectId}). Upload a new CSV to update the allowlist.`,
          });
        } else {
          // Project exists but user is not admin
          setSlugCheckError(`This slug is owned by ${admin.slice(0, 6)}...${admin.slice(-4)}. Please use a different slug or switch wallets.`);
        }
      } else {
        // Project doesn't exist - new project flow
        setIsExistingProject(false);
        setSlugVerified(true);
        // Clear any previous project state for a clean new project flow
        setProjectId(null);
        setProjectAdmin(null);
        setEstimatedGas(null);
        setGasPrice(null);
        setGasError(null);
        
        toast({
          title: "Slug Available",
          description: `"${normalizedSlug}.rwa-id.eth" is available. You'll create a new project.`,
        });
      }
    } catch (error: unknown) {
      // Log error details as string to avoid serialization issues
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : "Unknown";
      console.error("Slug check failed:", errorName, errorMessage);
      
      // Provide more specific error messages
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
  }, [slug, publicClient, address, toast]);

  // Fetch all projects owned by the connected wallet
  const fetchUserProjects = useCallback(async () => {
    if (!publicClient || !address) return;
    
    setIsLoadingProjects(true);
    try {
      // Iterate through project IDs to find projects owned by this wallet
      // The contract has relatively few projects, so this is efficient
      const projects: Array<{ projectId: bigint; slug: string; soulbound: boolean }> = [];
      const maxProjectsToCheck = 50; // Check up to 50 projects
      
      console.log("Scanning for projects owned by:", address);
      
      let consecutiveErrors = 0;
      for (let i = 1; i <= maxProjectsToCheck; i++) {
        try {
          const projectInfo = await publicClient.readContract({
            address: RWA_ID_REGISTRY_ADDRESS,
            abi: RWA_ID_REGISTRY_ABI,
            functionName: "projects",
            args: [BigInt(i)],
          }) as readonly [string, boolean, boolean, string, string, string];
          // [admin, soulbound, paused, slugHash, slug, baseURI]
          
          consecutiveErrors = 0; // Reset error count on success
          
          // Check if this project is owned by the connected wallet
          if (projectInfo[0] && projectInfo[0].toLowerCase() === address.toLowerCase()) {
            console.log(`Found project ${i}:`, projectInfo[4]); // slug is at index 4
            projects.push({
              projectId: BigInt(i),
              slug: projectInfo[4], // slug
              soulbound: projectInfo[1], // soulbound
            });
          }
        } catch (err) {
          consecutiveErrors++;
          console.log(`Error reading project ${i}:`, err instanceof Error ? err.message.slice(0, 100) : "Unknown error");
          // Stop scanning after 3 consecutive errors (likely past end of projects)
          if (consecutiveErrors >= 3) {
            console.log(`Stopped scanning after ${i} projects (3 consecutive errors)`);
            break;
          }
        }
      }
      
      console.log("Total projects found for user:", projects.length);
      setUserProjects(projects);
      
      if (projects.length > 0) {
        toast({
          title: "Projects Found",
          description: `You own ${projects.length} project(s). Select one to update or create a new project.`,
        });
      }
    } catch (error) {
      console.error("Failed to fetch user projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [publicClient, address, toast]);

  // Auto-fetch user's projects when wallet connects
  useEffect(() => {
    if (isConnected && address && publicClient && !isWrongNetwork) {
      fetchUserProjects();
    }
  }, [isConnected, address, publicClient, isWrongNetwork, fetchUserProjects]);

  // Select an existing project from the list
  const selectProject = useCallback((project: { projectId: bigint; slug: string; soulbound: boolean }) => {
    setSlug(project.slug);
    setProjectId(project.projectId);
    setSoulbound(project.soulbound);
    setIsExistingProject(true);
    setSlugVerified(true);
    setProjectAdmin(address || null);
    
    toast({
      title: "Project Selected",
      description: `"${project.slug}.rwa-id.eth" (ID: ${project.projectId}). Upload a CSV to update the allowlist.`,
    });
  }, [address, toast]);

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

  // Use on-chain admin if available, otherwise fall back to stored admin from createProject
  const adminToVerify = onChainAdmin || projectAdmin;
  
  const estimateGasForSetRoot = useCallback(async () => {
    if (!projectId || !merkleRoot || !publicClient || !address) return;
    
    // Use on-chain admin if available, otherwise use stored admin
    const admin = onChainAdmin || projectAdmin;
    
    // Block if wallet doesn't match project admin
    if (admin && admin.toLowerCase() !== address.toLowerCase()) {
      const shortAdmin = `${admin.slice(0, 6)}...${admin.slice(-4)}`;
      setGasError(`Wrong wallet. Project admin is ${shortAdmin}. Please switch wallets.`);
      console.error("Wallet mismatch - Connected:", address, "Admin:", admin);
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
        functionName: "setAllowlistRootForBadge",
        args: [projectId, BADGE_TYPE_DEFAULT, merkleRoot as `0x${string}`, fromTs, toTs],
      });
      
      // Log debug info
      console.log("=== Set Allowlist Root Debug ===");
      console.log("Contract:", RWA_ID_REGISTRY_ADDRESS);
      console.log("Function: setAllowlistRootForBadge");
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
    // setAllowlistRootForBadge(uint256,bytes32,bytes32,uint64,uint64) = 0x97ada692
    const expectedSelector = "0x97ada692";
    const calldata = encodeFunctionData({
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "setAllowlistRootForBadge",
      args: [projectId, BADGE_TYPE_DEFAULT, merkleRoot as `0x${string}`, fromTs, toTs],
    });
    const actualSelector = calldata.slice(0, 10);
    
    console.log("=== handleSetAllowlistRoot CALLED ===");
    console.log("Expected selector:", expectedSelector);
    console.log("Actual selector:", actualSelector);
    console.log("Selector match:", actualSelector === expectedSelector);
    console.log("Contract:", RWA_ID_REGISTRY_ADDRESS);
    console.log("Function: setAllowlistRootForBadge");
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
    
    // Call setAllowlistRootForBadge - NEVER createProject
    setAllowlistRoot({
      address: RWA_ID_REGISTRY_ADDRESS,
      abi: RWA_ID_REGISTRY_ABI,
      functionName: "setAllowlistRootForBadge",
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

  // Auto-estimate gas when entering setroot step with all required data
  useEffect(() => {
    const logicalStep = isExistingProject 
      ? ["connect", "upload", "setroot", "complete"][currentStep] 
      : ["connect", "create", "upload", "setroot", "complete"][currentStep];
    
    if (logicalStep === "setroot" && projectId && merkleRoot && publicClient && address && !estimatedGas && !isEstimatingGas && !gasError) {
      estimateGasForSetRoot();
    }
  }, [currentStep, isExistingProject, projectId, merkleRoot, publicClient, address, estimatedGas, isEstimatingGas, gasError, estimateGasForSetRoot]);

  // Re-estimate when validFrom/validTo change
  useEffect(() => {
    const logicalStep = isExistingProject 
      ? ["connect", "upload", "setroot", "complete"][currentStep] 
      : ["connect", "create", "upload", "setroot", "complete"][currentStep];
    
    if (logicalStep === "setroot" && projectId && merkleRoot && estimatedGas) {
      // Reset estimation when time window changes
      setEstimatedGas(null);
      setGasPrice(null);
      setGasError(null);
    }
  }, [validFrom, validTo, currentStep, isExistingProject, projectId, merkleRoot, estimatedGas]);

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
                    Please switch to Linea Mainnet
                  </div>
                )}
                {isConnected && !isWrongNetwork && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Connected to Linea Mainnet
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
                                ID: {project.projectId.toString()} · {project.soulbound ? "Soulbound" : "Transferable"}
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
              <CardTitle className="font-heading text-2xl">Set Allowlist Root</CardTitle>
              <CardDescription>
                Submit the Merkle root on-chain to enable claims
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                Valid From 0 = immediate. Valid To defaults to max value (no expiration). Use Unix timestamps for specific windows.
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
                  setValidTo("18446744073709551615");
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
