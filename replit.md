# RWA-ID - Decentralized Identity Registry

## Overview

A production-ready web application for creating and managing decentralized identity namespaces on Linea Mainnet. The platform enables organizations to create identity registries and users to claim soulbound identity tokens through Merkle proof verification.

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
│   │   │   ├── abi.ts         # Contract ABI and addresses
│   │   │   ├── wagmi-config.ts # Web3 configuration
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
- **Web3**: wagmi v2, viem, merkletreejs
- **Backend**: Express.js
- **Build**: Vite

## Domain Routes

- `/` - Landing page with hero, features, and how-it-works accordion
- `/console` - Platform console with 5-step onboarding wizard
- `/claim` - Public self-claim page (supports `/claim?slug=projectname`)

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

## Contract Interaction

**Contract Address**: `0x74aACeff8139c84433befB922a8E687B6ba51F3a`
**Chain**: Linea Mainnet (Chain ID: 59144)

### Functions Used
- `createProjectWithSlug(slug, soulbound, baseURI)` - Create new project
- `projectIdBySlugHash(slugHash)` - Get project ID
- `setAllowlistRootForBadgeWithWindow(projectId, badgeType, root, validFrom, validTo)` - Set Merkle root
- `claimFor(projectId, badgeType, recipient, nameHash, proof)` - Claim for recipient
- `claimSoulbound(projectId, badgeType, nameHash, name, proof)` - Claim soulbound identity

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_LINEA_RPC_URL | Linea RPC endpoint |
| VITE_RWA_ID_REGISTRY | Contract address |

## User Flows

### Platform Console (5 Steps)
1. Connect Wallet → Linea Mainnet
2. Create Project → slug, soulbound, baseURI
3. Upload CSV → name,address pairs
4. Set Allowlist Root → On-chain transaction with validFrom/validTo
5. Complete → Claim link generated, proofs JSON downloadable

### Self-Claim Flow
1. Navigate to `/claim?slug=X`
2. Provide proofs source (URL, upload, or paste JSON)
3. Enter assigned name
4. Connect wallet
5. Check eligibility → Merkle proof verification
6. Claim identity → Soulbound token minted

## Development Notes

- Storage is in-memory (data resets on restart)
- CSV should not be logged for privacy
- Frontend uses Inter and Space Grotesk fonts
- Dark/light theme support with localStorage persistence
- BadgeType default: bytes32(0) = 0x000...000
