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
│   │   │   ├── platform.tsx   # Platform onboarding (/platform)
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
- **Web3**: wagmi v2, viem
- **Backend**: Express.js
- **Build**: Vite

## Domain Routes

- `/` - Landing page with hero, features, and how-it-works accordion
- `/platform` - Platform dashboard with 5-step onboarding wizard
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

## Merkle Tree Implementation

### Leaf Format
```
keccak256(abi.encodePacked(address, nameLowercase))
```

- Address is converted to lowercase
- Name is trimmed and converted to lowercase
- Tree uses sorted pairs for consistent root computation

## Contract Interaction

**Contract Address**: `0x74aACeff8139c84433befB922a8E687B6ba51F3a`
**Chain**: Linea Mainnet (Chain ID: 59144)

### Functions Used
- `createProject(slug, baseURI, soulbound)` - Create new project
- `projectIdBySlugHash(slugHash)` - Get project ID
- `setAllowlistRoot(projectId, badgeType, merkleRoot)` - Set Merkle root
- `claimSoulbound(projectId, badgeType, nameHash, name, proof)` - Claim identity

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_LINEA_RPC_URL | Linea RPC endpoint |
| VITE_RWA_ID_REGISTRY | Contract address |

## User Flows

### Platform Onboarding (5 Steps)
1. Connect Wallet → Linea Mainnet
2. Create Project → slug, baseURI, soulbound option
3. Upload CSV → name,address pairs
4. Set Allowlist Root → On-chain transaction
5. Complete → Claim link generated

### Self-Claim Flow
1. Navigate to `/claim?slug=X`
2. Enter assigned name
3. Connect wallet
4. Check eligibility → Merkle proof verification
5. Claim identity → Soulbound token minted

## Development Notes

- Storage is in-memory (data resets on restart)
- CSV should not be logged for privacy
- Frontend uses Inter and Space Grotesk fonts
- Dark/light theme support with localStorage persistence
