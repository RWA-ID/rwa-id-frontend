import { keccak256, encodePacked, type Hex } from "viem";

export interface MerkleEntry {
  name: string;
  address: string;
}

export interface MerkleTreeResult {
  root: Hex;
  leaves: Hex[];
  entries: MerkleEntry[];
}

export function computeLeaf(address: string, name: string): Hex {
  const nameLower = name.toLowerCase().trim();
  const addrLower = address.toLowerCase() as `0x${string}`;
  return keccak256(encodePacked(["address", "string"], [addrLower, nameLower]));
}

export function computeNameHash(name: string): Hex {
  return keccak256(encodePacked(["string"], [name.toLowerCase().trim()]));
}

function sortPair(a: Hex, b: Hex): [Hex, Hex] {
  return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
}

function hashPair(a: Hex, b: Hex): Hex {
  const [left, right] = sortPair(a, b);
  return keccak256(encodePacked(["bytes32", "bytes32"], [left, right]));
}

export function buildMerkleTree(entries: MerkleEntry[]): MerkleTreeResult {
  if (entries.length === 0) {
    throw new Error("Cannot build Merkle tree with empty entries");
  }

  const leaves = entries.map((entry) => computeLeaf(entry.address, entry.name));
  
  const sortedLeaves = [...leaves].sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  if (sortedLeaves.length === 1) {
    return {
      root: sortedLeaves[0],
      leaves,
      entries,
    };
  }

  let currentLevel = sortedLeaves;

  while (currentLevel.length > 1) {
    const nextLevel: Hex[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }
    
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0],
    leaves,
    entries,
  };
}

export function generateProof(
  entries: MerkleEntry[],
  targetAddress: string,
  targetName: string
): { proof: Hex[]; leaf: Hex; found: boolean } {
  const targetLeaf = computeLeaf(targetAddress, targetName);
  
  const leaves = entries.map((entry) => computeLeaf(entry.address, entry.name));
  
  const leafIndex = leaves.findIndex(
    (leaf) => leaf.toLowerCase() === targetLeaf.toLowerCase()
  );

  if (leafIndex === -1) {
    return { proof: [], leaf: targetLeaf, found: false };
  }

  const sortedLeaves = [...leaves].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  const sortedIndex = sortedLeaves.findIndex(
    (leaf) => leaf.toLowerCase() === targetLeaf.toLowerCase()
  );

  if (sortedIndex === -1) {
    return { proof: [], leaf: targetLeaf, found: false };
  }

  const proof: Hex[] = [];
  let currentLevel = sortedLeaves;
  let currentIndex = sortedIndex;

  while (currentLevel.length > 1) {
    const isLeftNode = currentIndex % 2 === 0;
    const siblingIndex = isLeftNode ? currentIndex + 1 : currentIndex - 1;

    if (siblingIndex < currentLevel.length) {
      proof.push(currentLevel[siblingIndex]);
    }

    const nextLevel: Hex[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
      } else {
        nextLevel.push(currentLevel[i]);
      }
    }

    currentLevel = nextLevel;
    currentIndex = Math.floor(currentIndex / 2);
  }

  return { proof, leaf: targetLeaf, found: true };
}

export function parseCSV(csvText: string): MerkleEntry[] {
  const lines = csvText.trim().split(/\r?\n/);
  
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("name") || header.includes("address");
  const startIndex = hasHeader ? 1 : 0;

  const entries: MerkleEntry[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",").map((p) => p.trim());
    
    if (parts.length < 2) {
      throw new Error(`Invalid CSV row ${i + 1}: expected name,address`);
    }

    const [name, address] = parts;

    if (!name) {
      throw new Error(`Invalid CSV row ${i + 1}: name is empty`);
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error(`Invalid CSV row ${i + 1}: invalid Ethereum address "${address}"`);
    }

    entries.push({ name, address });
  }

  if (entries.length === 0) {
    throw new Error("No valid entries found in CSV");
  }

  return entries;
}
