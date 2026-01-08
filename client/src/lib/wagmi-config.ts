import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { linea } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { http } from "viem";

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "";

export const metadata = {
  name: "RWA-ID",
  description: "Decentralized Identity Registry on Linea",
  url: typeof window !== "undefined" ? window.location.origin : "https://rwa-id.com",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [linea];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  transports: {
    [linea.id]: http("https://rpc.linea.build"),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
