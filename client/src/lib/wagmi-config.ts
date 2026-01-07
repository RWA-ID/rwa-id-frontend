import { createConfig, http } from "wagmi";
import { linea } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

const lineaRpcUrl = import.meta.env.VITE_LINEA_RPC_URL || "https://rpc.linea.build";

export const wagmiConfig = createConfig({
  chains: [linea],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [linea.id]: http(lineaRpcUrl),
  },
});
