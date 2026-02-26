# RWA-ID - Decentralized Identity Registry

## Overview

A production-ready web application for creating and managing decentralized identity namespaces on Ethereum Mainnet. The platform enables organizations to create identity registries and users to claim identity tokens through Merkle proof verification.

## Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── theme-provider.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── wallet-button.tsx
│   │   │   └── stepper.tsx
│   │   ├── lib/
│   │   │   ├── abi.ts         # Contract ABI (v2) and addresses
│   │   │   ├── wagmi-config.ts # Web3 configuration (RainbowKit)
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── landing.tsx    # Landing page (/)
│   │   │   ├── console.tsx    # Platform console (/console)
│   │   │   ├── claim.tsx      # Claim page (/claim)
│   │   │   └── not-found.tsx
│   │   ├── App.tsx
│   │   └── index.css
│   └── index.html
├── server/                    # Backend Express server
│   ├── merkle.ts              # Merkle tree utilities
│   ├── routes.ts              # API routes
│   ├── storage.ts             # In-memory storage
│   └── index.ts
├── shared/
│   └── schema.ts              # Shared TypeScript schemas
└── README.md                  # User documentation
```

## Key Technologies

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Web3**: wagmi v2, viem, RainbowKit v2, merkletreejs
- **Backend**: Express.js
- **Build**: Vite

## Domain Routes

- `/` - Landing page with hero, features, and how-it-works accordion
- `/console` - Platform console with 5-step onboarding wizard
- `/claim` - Public self-claim page

## API Endpoints

### POST /api/platform/upload
- **Purpose**: Parse CSV and generate Merkle tree
- **Body**: `{ slug: string, csvText: string }`
- **Returns**: `{ merkleRoot: string, rowCount: number }`

### GET /api/proof
- **Purpose**: Generate Merkle proof for eligibility check
- **Query**: `?slug=X&name=Y&address=Z`
- **Returns**: `{ proof: string[], nameHash: string, eligible: boolean }`

### GET /api/project/:slug
- **Purpose**: Get project metadata
- **Returns**: `{ slug, merkleRoot, entryCount, createdAt }`

### GET /api/claimable
- **Purpose**: Get all claimable identities for a wallet
- **Query**: `?address=0x...`
- **Returns**: `{ claims: [{ slug, projectId, name, nameHash, proof }] }`

## Merkle Tree Implementation (CRITICAL)

### Hash Format
```javascript
// slugHash
slugHash = keccak256(toBytes(slug.trim().toLowerCase()))

// nameHash
nameHash = keccak256(toBytes(name.trim().toLowerCase()))

// leaf
leaf = keccak256(abi.encodePacked(address, nameHash))
// where address is 20 bytes, nameHash is 32 bytes
```

- Tree uses `merkletreejs` with `sortPairs: true`
- Address is converted to lowercase (20 bytes)
- Name is trimmed and converted to lowercase, then hashed to 32 bytes

## Contract Interaction (v2)

**Contract Address (RWAIDv2)**: `0xD0B565C7134bDB16Fc3b8A9Cb5fdA003C37930c2`
**USDC**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
**Chain**: Ethereum Mainnet (Chain ID: 1)

### ABI Exports (from abi.ts)
- `rwaIdV2Abi` - Full contract ABI
- `RWAID_V2_ADDRESS` - Contract address
- `usdcAbi` - USDC ABI (approve/allowance)
- `USDC_ADDRESS` - USDC contract address
- `CHAIN_ID` - 1 (Ethereum Mainnet)

### Functions Used (v2)
- `createProject(slug, treasury, claimFee, transferable)` - Create new project (nonpayable)
- `updateMerkleRoot(projectId, newRoot, newTotalAllowlisted)` - Update Merkle root
- `claim(projectId, nameHash, proof)` - Claim identity token
- `projects(projectId)` - Read project data: [owner, slug, slugHash, treasury, claimFee, transferable, merkleRoot, active, totalClaimed, totalRevenue]

### Project ID Lookup
No `projectIdBySlugHash` in v2. Must scan `projects(1)`, `projects(2)`, etc. and match by `slugHash`. Console and claim pages both do this scan with a max of 50 projects and 3 consecutive error bail-out.

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_REOWN_PROJECT_ID | RainbowKit/WalletConnect project ID |
| SESSION_SECRET | Express session secret |

## User Flows

### Platform Console (5 Steps - New Project)
1. Connect Wallet & Select Project → Ethereum Mainnet, enter/select slug
2. Create Project → slug, treasury address, claim fee (USD → USDC 6-decimal), transferable toggle
3. Upload CSV → name,address pairs; editable Project ID field
4. Update Merkle Root → On-chain transaction with gas estimation
5. Complete → Claim link generated, proofs JSON downloadable

### Platform Console (4 Steps - Existing Project)
1. Connect Wallet & Select Project → Select from owned projects list
2. Upload CSV → name,address pairs; Project ID auto-filled
3. Update Merkle Root → On-chain transaction
4. Complete → Updated claim link

### Self-Claim Flow
1. Connect wallet on /claim
2. Auto-discovers claimable identities from server
3. Click "Claim" → calls `claim(projectId, nameHash, proof)` on-chain
4. View transaction on Etherscan

## Development Notes

- Storage is in-memory (data resets on restart)
- CSV should not be logged for privacy
- Frontend uses Inter and Space Grotesk fonts
- Dark/light theme support with localStorage persistence
- Claim fee input is in USD, converted to USDC 6-decimal on-chain (e.g., $1.00 → 1000000)
- No toast notifications — errors displayed inline
- Wallet stack: RainbowKit v2 + wagmi v2 + viem
