import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet } from "wagmi/chains";
import { fallback, http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "RWA ID",
  projectId: "a5641b37fa2de3fa096da490333e3492",
  chains: [mainnet],
  transports: {
    [mainnet.id]: fallback([
      http("https://eth.llamarpc.com"),
      http("https://rpc.ankr.com/eth"),
      http("https://ethereum-rpc.publicnode.com"),
      http(),
    ]),
  },
  ssr: true,
});
