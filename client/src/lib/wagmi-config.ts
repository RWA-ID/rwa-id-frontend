import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { linea } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

const lineaRpcUrl = import.meta.env.VITE_LINEA_RPC_URL || "https://rpc.linea.build";

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "";

export const metadata = {
  name: "RWA-ID",
  description: "Decentralized Identity Registry on Linea",
  url: typeof window !== "undefined" ? window.location.origin : "https://rwa-id.replit.app",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [linea];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  transports: {
    [linea.id]: lineaRpcUrl,
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
