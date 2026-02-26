export const RWA_ID_REGISTRY_ABI = [
  {
    name: "createProjectWithSlug",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "slug", type: "string" },
      { name: "soulbound", type: "bool" },
      { name: "baseURI_", type: "string" },
    ],
    outputs: [{ name: "projectId", type: "uint256" }],
  },
  {
    name: "projectIdBySlugHash",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "slugHash", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "setAllowlistRootForBadge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "badgeType", type: "bytes32" },
      { name: "root", type: "bytes32" },
      { name: "validFrom", type: "uint64" },
      { name: "validTo", type: "uint64" },
    ],
    outputs: [],
  },
  {
    name: "claimFor",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "badgeType", type: "bytes32" },
      { name: "recipient", type: "address" },
      { name: "nameHash", type: "bytes32" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [],
  },
  {
    name: "claimSoulbound",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "badgeType", type: "bytes32" },
      { name: "nameHash", type: "bytes32" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [],
  },
  {
    name: "projectFee",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "projects",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "projectId", type: "uint256" }],
    outputs: [
      { name: "admin", type: "address" },
      { name: "soulbound", type: "bool" },
      { name: "paused", type: "bool" },
      { name: "slugHash", type: "bytes32" },
      { name: "slug", type: "string" },
      { name: "baseURI", type: "string" },
    ],
  },
  {
    name: "ProjectCreated",
    type: "event",
    inputs: [
      { name: "projectId", type: "uint256", indexed: true },
      { name: "admin", type: "address", indexed: true },
      { name: "slugHash", type: "bytes32", indexed: true },
      { name: "slug", type: "string", indexed: false },
    ],
  },
] as const;

export const CHAIN_ID = 1;
export const RWA_ID_REGISTRY_ADDRESS = "0xD0B565C7134bDB16Fc3b8A9Cb5fdA003C37930c2" as const;
export const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;
export const BADGE_TYPE_DEFAULT = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;
