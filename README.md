# RWA-ID - Decentralized Identity Registry

A production-ready web application for creating and managing decentralized identity namespaces on Linea Mainnet. Supports platform onboarding and public self-claim flows with Merkle proof verification.

## Features

- **Platform Onboarding** (`/platform`): Create projects, upload allowlists, and set Merkle roots on-chain
- **Public Self-Claim** (`/claim`): Users can claim their soulbound identity tokens
- **Merkle Proof Verification**: Supports millions of allowlisted claims efficiently
- **Linea Mainnet**: Deployed on Linea (Chain ID: 59144)

## Environment Variables

Set the following environment variables before running:

```bash
# Required
VITE_LINEA_RPC_URL=https://rpc.linea.build
VITE_RWA_ID_REGISTRY=0x74aACeff8139c84433befB922a8E687B6ba51F3a

# Optional
VITE_GATEWAY_HEALTH=https://rwaid-gatewayzip--nftworldeth.replit.app/health
```

## Usage

### For Platforms (`/platform`)

1. **Connect Wallet**: Connect your wallet to Linea Mainnet
2. **Create Project**: Enter your project slug, base URI, and choose soulbound option
3. **Upload CSV**: Upload a CSV with `name,address` columns
4. **Set Allowlist Root**: Submit the Merkle root on-chain
5. **Share Claim Link**: Copy the claim link for your users

### For Users (`/claim`)

1. Navigate to `/claim?slug=YOUR_PROJECT_SLUG`
2. Enter your assigned name
3. Connect your wallet
4. Check eligibility (automatic Merkle proof verification)
5. Claim your identity token

After claiming, your identity will be: `{name}.{slug}.rwa-id.eth`

## CSV Format

The allowlist CSV should have two columns:

```csv
name,address
hector,0x1234567890abcdef1234567890abcdef12345678
alice,0xabcdef1234567890abcdef1234567890abcdef12
bob,0x9876543210fedcba9876543210fedcba98765432
```

## Leaf Hash Format

Each leaf in the Merkle tree is computed as:

```
keccak256(abi.encodePacked(address, nameLowercase))
```

Where:
- `address`: The Ethereum address (lowercase)
- `nameLowercase`: The name converted to lowercase

The Merkle tree uses sorted pairs for consistent root computation.

## Contract ABI

The application interacts with the RWA-ID Registry contract at `0x74aACeff8139c84433befB922a8E687B6ba51F3a` using these functions:

- `createProject(string slug, string baseURI, bool soulbound) payable returns (uint256 projectId)`
- `projectIdBySlugHash(bytes32 slugHash) view returns (uint256)`
- `setAllowlistRoot(uint256 projectId, bytes32 badgeType, bytes32 merkleRoot)`
- `claimSoulbound(uint256 projectId, bytes32 badgeType, bytes32 nameHash, string name, bytes32[] proof)`

## API Routes

### POST /api/platform/upload

Upload a CSV and generate a Merkle tree.

**Request:**
```json
{
  "slug": "myproject",
  "csvText": "name,address\nhector,0x1234..."
}
```

**Response:**
```json
{
  "merkleRoot": "0x...",
  "rowCount": 100
}
```

### GET /api/proof

Get a Merkle proof for a specific address and name.

**Query Parameters:**
- `slug`: Project slug
- `name`: User's name
- `address`: User's wallet address

**Response:**
```json
{
  "proof": ["0x...", "0x..."],
  "nameHash": "0x...",
  "eligible": true
}
```

## Development

```bash
npm install
npm run dev
```

The application runs on port 5000.

## Tech Stack

- React + TypeScript
- Vite
- TailwindCSS
- wagmi + viem (Web3)
- Express.js (Backend)
- In-memory storage (Merkle tree data)
