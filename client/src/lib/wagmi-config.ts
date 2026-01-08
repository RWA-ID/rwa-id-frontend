import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { linea } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { http } from "viem";

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "";

// Use current origin in development, production domain in production
const getMetadataUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "rwa-id.com" || hostname === "www.rwa-id.com") {
      return "https://rwa-id.com";
    }
    return window.location.origin;
  }
  return "https://rwa-id.com";
};

export const metadata = {
  name: "RWA-ID",
  description: "Decentralized Identity Registry on Linea",
  url: getMetadataUrl(),
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
