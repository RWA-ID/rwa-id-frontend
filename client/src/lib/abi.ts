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
    name: "setAllowlistRootForBadgeWithWindow",
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
    name: "setAllowlistRootForBadge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "projectId", type: "uint256" },
      { name: "badgeType", type: "bytes32" },
      { name: "root", type: "bytes32" },
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
      { name: "name", type: "string" },
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
] as const;

export const LINEA_CHAIN_ID = 59144;
export const RWA_ID_REGISTRY_ADDRESS = "0x74aACeff8139c84433befB922a8E687B6ba51F3a" as const;
export const BADGE_TYPE_DEFAULT = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;
