import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Building2,
  Users,
  Shield,
  Upload,
  CheckCircle,
  ExternalLink,
  Copy,
  Layers,
  Fingerprint,
  Zap,
  FileText,
} from "lucide-react";
import { SiGithub, SiX, SiEthereum, SiPolygon } from "react-icons/si";
import { useState } from "react";
import lineaLogo from "@assets/Wordmark_Blue_BG_1768681663242.png";
import uniswapLogo from "@assets/Uniswap_icon_pink_1771203542816.png";

const CONTRACT_ADDRESS = "0x74aACeff8139c84433befB922a8E687B6ba51F3a";

export default function Landing() {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-8 w-8 text-primary" />
              <span className="font-heading text-xl font-bold">RWA-ID</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/console">
                <Button variant="ghost" size="sm" data-testid="link-console-nav">
                  Platform Console
                </Button>
              </Link>
              <Link href="/claim">
                <Button variant="ghost" size="sm" data-testid="link-claim-nav">
                  Claim
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-3 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#61dfff] text-sm font-medium">
                  <span className="text-black/70">Powered by</span>
                  <img src={lineaLogo} alt="Linea" className="h-8 object-contain" />
                </div>
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                  Decentralized Identity
                  <span className="block text-primary">For Real World Assets And Client Wallets</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
                  Create namespace registries and issue verifiable, soulbound identities
                  at scale. Supports millions of allowlisted claims via Merkle proof verification.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link href="/console">
                    <Button size="lg" className="rounded-full px-8" data-testid="button-platform-console">
                      <Building2 className="mr-2 h-5 w-5" />
                      Platform Console
                    </Button>
                  </Link>
                  <Link href="/claim">
                    <Button variant="outline" size="lg" className="rounded-full px-8" data-testid="button-claim-identity">
                      <Users className="mr-2 h-5 w-5" />
                      Claim Identity
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-2 relative">
                <div className="relative aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl" />
                  <div className="absolute inset-4 bg-card rounded-2xl border shadow-lg flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Fingerprint className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-sm text-muted-foreground">yourproject.rwa-id.eth</p>
                      <p className="font-heading text-xl font-semibold mt-2">Verified Identity</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Soulbound on Linea</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
                For Platforms
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Create your RWA-ID namespace and issue identities to your users at scale
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Layers className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold">Create Namespace</h3>
                  <p className="text-muted-foreground">
                    Register your unique project slug and establish your identity namespace on-chain
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold">Upload Allowlist</h3>
                  <p className="text-muted-foreground">
                    Upload a CSV of names and wallet addresses to generate a Merkle tree
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Zap className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold">Deploy at Scale</h3>
                  <p className="text-muted-foreground">
                    Set the Merkle root on-chain and enable millions of users to claim
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <p className="text-lg text-muted-foreground">
                  RWA ID is not here to replace your existing KYC, compliance, or internal identity systems.
                </p>
                <p className="text-lg font-semibold text-foreground">
                  It's here to complement them.
                </p>
                <p className="text-muted-foreground">
                  RWA ID lets platforms issue human-readable, on-chain identities to wallets that are already verified in your system.
                </p>
                <ul className="space-y-3">
                  {[
                    "Wallets get names instead of hex addresses",
                    "Names are verifiable on-chain",
                    "Platforms keep full control of compliance off-chain",
                    "Clients gain a safer way to send & receive RWAs",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>No new trust assumptions.</p>
                  <p>No changes to your KYC stack.</p>
                  <p className="text-foreground font-medium">
                    Just an extra identity layer that improves UX, verification, and security.
                  </p>
                </div>
              </div>

              <div className="relative max-w-sm mx-auto w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl" />
                <div className="relative bg-card rounded-2xl border shadow-lg p-6 m-4 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Fingerprint className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold">Joe Smith</p>
                      <p className="text-xs text-muted-foreground font-mono">0x7a3b...9f2d</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Resolved Identity</span>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">Verified</span>
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <p className="font-mono text-primary font-semibold text-center" data-testid="text-example-identity">joe.test.rwa-id.eth</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Type</p>
                      <p className="text-xs font-medium">Soulbound</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Network</p>
                      <p className="text-xs font-medium">Linea</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>KYC verified off-chain &middot; Identity on-chain</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
                  For Users
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Claim your verified identity with a simple, gas-efficient process
                </p>
                <ul className="space-y-4">
                  {[
                    "Connect your wallet and enter your assigned name",
                    "Automatic eligibility check via Merkle proof",
                    "Claim your soulbound identity token",
                    "Receive your resolved name: name.slug.rwa-id.eth",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card rounded-2xl border p-6 sm:p-8">
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Fingerprint className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading text-xl font-semibold mb-2">Ready to Claim?</p>
                    <p className="text-muted-foreground mb-6">
                      If you have been assigned an identity by a platform, you can claim it now.
                    </p>
                  </div>
                  <Link href="/claim">
                    <Button className="w-full" size="lg" data-testid="button-claim-cta">
                      <Fingerprint className="mr-2 h-5 w-5" />
                      Go to Claim Page
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-8">
              How It Works
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="merkle" className="bg-card rounded-xl border px-6">
                <AccordionTrigger className="text-left font-semibold" data-testid="accordion-merkle">
                  What is Merkle Proof Verification?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  Merkle trees allow us to verify that a specific wallet + name combination
                  is part of an allowlist without storing the entire list on-chain. Only the
                  root hash is stored, making it extremely gas-efficient to support millions
                  of claims.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="soulbound" className="bg-card rounded-xl border px-6">
                <AccordionTrigger className="text-left font-semibold" data-testid="accordion-soulbound">
                  What are Soulbound Tokens?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  Soulbound tokens (SBTs) are non-transferable NFTs that represent identity,
                  credentials, or affiliations. Once claimed, they are permanently bound to
                  your wallet address and cannot be sold or transferred.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="leaf" className="bg-card rounded-xl border px-6">
                <AccordionTrigger className="text-left font-semibold" data-testid="accordion-leaf">
                  How is the Leaf Hash Computed?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  <p className="mb-2">
                    Each leaf in the Merkle tree is computed as:
                  </p>
                  <code className="block bg-muted px-3 py-2 rounded-lg font-mono text-sm mb-2">
                    nameHash = keccak256(name.trim().toLowerCase())
                  </code>
                  <code className="block bg-muted px-3 py-2 rounded-lg font-mono text-sm">
                    leaf = keccak256(abi.encodePacked(address, nameHash))
                  </code>
                  <p className="mt-2">
                    The name is trimmed and converted to lowercase, then hashed before being packed with the address.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="csv" className="bg-card rounded-xl border px-6">
                <AccordionTrigger className="text-left font-semibold" data-testid="accordion-csv">
                  What CSV Format is Required?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  <p className="mb-2">
                    The CSV should have two columns: <code>name</code> and <code>address</code>.
                    Example:
                  </p>
                  <pre className="bg-muted px-3 py-2 rounded-lg font-mono text-sm overflow-x-auto">
{`name,address
hector,0x1234567890abcdef1234567890abcdef12345678
alice,0xabcdef1234567890abcdef1234567890abcdef12`}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
                Cross-Chain Name Resolution
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                RWA ID names resolve across major blockchains and wallets via Chainlink CCIP
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <h3 className="font-heading text-lg font-semibold mb-5">Supported Blockchains</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "Ethereum", icon: <SiEthereum className="w-5 h-5" />, color: "text-[#627EEA]" },
                      { name: "Linea", icon: <img src={lineaLogo} alt="Linea" className="w-5 h-5 object-contain" />, color: "" },
                      { name: "Base", icon: <svg className="w-5 h-5" viewBox="0 0 111 111" fill="none"><path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="#0052FF"/></svg>, color: "" },
                      { name: "Optimism", icon: <svg className="w-5 h-5" viewBox="0 0 500 500" fill="none"><circle cx="250" cy="250" r="250" fill="#FF0420"/><path d="M177.133 316.446C162.247 316.446 150.051 312.943 140.544 305.938C131.162 298.808 126.471 289.238 126.471 277.228C126.471 274.724 126.721 271.596 127.221 267.843L140.044 194.538H170.379L157.806 266.344C157.556 267.843 157.431 269.592 157.431 271.596C157.431 281.478 163.122 286.419 174.504 286.419C183.261 286.419 190.643 283.541 196.647 277.728C202.776 271.784 206.842 263.905 208.841 254.148L220.165 194.538H250.499L233.115 284.29C232.49 287.294 232.178 289.674 232.178 291.428C232.178 293.058 232.615 294.307 233.49 295.181C234.49 295.931 236.114 296.306 238.363 296.306L233.115 316.196C227.236 317.695 222.232 318.445 218.103 318.445C211.474 318.445 206.592 317.07 203.468 314.317C200.469 311.563 198.845 307.935 198.595 303.433C186.338 312.443 172.379 316.946 156.618 316.946L177.133 316.446Z" fill="white"/><path d="M289.282 316.446C276.147 316.446 265.39 312.693 257.008 305.188C248.751 297.558 244.622 287.669 244.622 275.534C244.622 272.405 244.997 269.027 245.747 265.399C248.876 249.584 255.568 237.137 265.828 228.064C276.085 218.991 288.657 214.455 303.542 214.455C316.677 214.455 327.434 218.208 335.816 225.713C344.073 233.218 348.202 243.107 348.202 255.367C348.202 258.371 347.827 261.749 347.077 265.502C343.948 281.192 337.131 293.577 326.624 302.65C316.242 311.848 303.667 316.446 289.282 316.446ZM291.406 287.169C299.163 287.169 305.793 284.165 311.297 278.103C316.927 271.971 320.618 263.78 322.367 253.523C322.742 251.019 322.867 248.765 322.867 246.761C322.867 236.629 317.301 231.563 306.169 231.563C298.412 231.563 291.781 234.567 286.278 240.629C280.774 246.636 277.083 254.89 275.208 265.399C274.833 267.528 274.708 269.782 274.708 272.036C274.708 282.043 280.274 287.169 291.406 287.169Z" fill="white"/></svg>, color: "" },
                      { name: "Arbitrum", icon: <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="20" fill="#213147"/><path d="M24.076 21.843l1.858-3.152 4.089 6.885-.003 1.476-2.028-3.392-3.916-1.817z" fill="#12AAFF"/><path d="M20.306 14.312l3.77 6.33-3.916 1.817-.09-.15-3.764-6.304 3.47-1.466.53-.227z" fill="#9DCCED"/><path d="M27.979 13.397l.003.135v12.505l-1.95 1.1-1.956-3.294-3.77-6.33.53-.227L27.979 13.397z" fill="white"/><path d="M12.024 26.037l.003-12.505 5.893 2.49.09.15 3.764 6.304-3.916 1.817-3.878 6.544-1.956-1.1v-3.7z" fill="white"/><path d="M12.024 26.037v3.7l1.956 1.1 3.878-6.544 1.858-3.152-3.77-6.33 5.893-2.49-.003-.135-6.812 2.876-3 1.275v9.7z" fill="#213147"/></svg>, color: "" },
                      { name: "Polygon", icon: <SiPolygon className="w-5 h-5" />, color: "text-[#8247E5]" },
                    ].map((chain) => (
                      <div key={chain.name} className="flex items-center gap-3 p-2" data-testid={`chain-${chain.name.toLowerCase()}`}>
                        <div className={`flex-shrink-0 ${chain.color}`}>
                          {chain.icon}
                        </div>
                        <span className="text-sm font-medium">{chain.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <h3 className="font-heading text-lg font-semibold mb-5">Native Wallet Support</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "MetaMask", icon: <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none"><path d="M36.08 3.36L22.16 13.68l2.56-6.08L36.08 3.36z" fill="#E2761B" stroke="#E2761B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.92 3.36l13.76 10.4-2.4-6.16L3.92 3.36zM31.04 27.44l-3.68 5.68 7.88 2.16 2.28-7.72-6.48-.12zM2.52 27.56l2.24 7.72 7.88-2.16-3.68-5.68-6.44.12z" fill="#E4761B" stroke="#E4761B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M12.32 17.32l-2.2 3.36 7.84.36-.28-8.44-5.36 4.72zM27.68 17.32l-5.44-4.8-.2 8.52 7.84-.36-2.2-3.36zM12.64 33.12l4.72-2.32-4.08-3.2-.64 5.52zM22.64 30.8l4.72 2.32-.64-5.52-4.08 3.2z" fill="#E4761B" stroke="#E4761B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M27.36 33.12l-4.72-2.32.38 3.08-.04 1.3 4.38-2.06zM12.64 33.12l4.38 2.06-.04-1.3.38-3.08-4.72 2.32z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M17.08 26.16l-3.92-1.16 2.76-1.28 1.16 2.44zM22.92 26.16l1.16-2.44 2.8 1.28-3.96 1.16z" fill="#233447" stroke="#233447" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M12.64 33.12l.68-5.68-4.36.12 3.68 5.56zM26.68 27.44l.68 5.68 3.68-5.56-4.36-.12zM29.88 20.68l-7.84.36.72 4.04 1.16-2.44 2.8 1.28 3.16-3.24zM13.16 23.92l2.8-1.28 1.16 2.44.72-4.04-7.84-.36 3.16 3.24z" fill="#CD6116" stroke="#CD6116" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 20.68l3.28 6.4-.12-3.16L10 20.68zM26.84 23.92l-.12 3.16 3.28-6.4-3.16 3.24zM17.84 21.04l-.72 4.04.92 4.68.2-6.16-.4-2.56zM22.04 21.04l-.4 2.52.2 6.2.92-4.68-.72-4.04z" fill="#E4751F" stroke="#E4751F" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M22.76 25.08l-.92 4.68.64.44 4.08-3.2.12-3.16-3.92 1.24zM13.16 23.84l.12 3.16 4.08 3.2.64-.44-.92-4.68-3.92-1.24z" fill="#F6851B" stroke="#F6851B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M22.84 35.18l.04-1.3-.36-.3h-5.04l-.36.3.04 1.3-4.52-2.06 1.56 1.28 3.2 2.2h5.12l3.2-2.2 1.56-1.28-4.44 2.06z" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M22.48 30.88l-.64-.44h-3.68l-.64.44-.38 3.08.36-.3h5.04l.36.3-.42-3.08z" fill="#161616" stroke="#161616" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M36.68 14.36l1.2-5.72L36.08 3.36l-13.6 10.12 5.24 4.44 7.4 2.16 1.64-1.92-.72-.52 1.12-1.04-.84-.68 1.12-.84-.76-.52zM2.12 8.64l1.2 5.72-.76.56 1.12.84-.84.64 1.12 1.04-.72.52 1.64 1.92 7.4-2.16 5.24-4.44L3.92 3.36 2.12 8.64z" fill="#763D16" stroke="#763D16" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M35.12 20.08l-7.4-2.16 2.24 3.36-3.28 6.4 4.32-.04h6.44l-2.32-7.56zM12.28 17.92l-7.4 2.16-2.4 7.56h6.44l4.32.04-3.28-6.4 2.32-3.36zM22.04 21.04l.48-8.16 2.12-5.76H15.36l2.12 5.76.48 8.16.2 2.56v6.16h3.68v-6.16l.2-2.56z" fill="#F6851B" stroke="#F6851B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                      { name: "Trust", icon: <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none"><defs><linearGradient id="tw" x1="8" y1="4" x2="24" y2="20" gradientUnits="userSpaceOnUse"><stop stopColor="#48FF91"/><stop offset="1" stopColor="#0500FF"/></linearGradient></defs><path d="M20 3C12 6.5 6 8 6 8V22C6 28 20 37 20 37C20 37 34 28 34 22V8C34 8 28 6.5 20 3Z" fill="#0500FF"/><path d="M20 3C12 6.5 6 8 6 8V22C6 24 10 28 20 28V3Z" fill="url(#tw)"/></svg> },
                      { name: "Rainbow", icon: <svg className="w-5 h-5" viewBox="0 0 120 120" fill="none"><defs><linearGradient id="rg1" x1="60" y1="0" x2="60" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#174299"/><stop offset="0.2" stopColor="#001E59"/><stop offset="0.4" stopColor="#174299"/><stop offset="0.55" stopColor="#0052FF"/><stop offset="0.65" stopColor="#00A7F7"/><stop offset="0.75" stopColor="#6BD5E1"/><stop offset="0.82" stopColor="#FFD014"/><stop offset="0.9" stopColor="#FF9901"/><stop offset="1" stopColor="#FF4000"/></linearGradient></defs><rect width="120" height="120" rx="26" fill="url(#rg1)"/><path d="M20 75C20 47.386 42.386 25 70 25V45C53.431 45 40 58.431 40 75H20Z" fill="white" fillOpacity="0.8"/><circle cx="70" cy="75" r="20" fill="white" fillOpacity="0.8"/></svg> },
                      { name: "Uniswap", icon: <img src={uniswapLogo} alt="Uniswap" className="w-5 h-5 object-contain" /> },
                    ].map((wallet) => (
                      <div key={wallet.name} className="flex items-center gap-3 p-2" data-testid={`wallet-${wallet.name.toLowerCase()}`}>
                        <div className="flex-shrink-0">
                          {wallet.icon}
                        </div>
                        <span className="text-sm font-medium">{wallet.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-5">
                    And all blockchain scanners that support CCIP read
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-10">
              <a href="https://chain.link/" target="_blank" rel="noopener noreferrer" data-testid="link-chainlink-badge">
                <img src="https://chain.link/badge-cross-chain-white" alt="CCIP secured with Chainlink" className="h-12 dark:block hidden" />
                <img src="https://chain.link/badge-cross-chain-black" alt="CCIP secured with Chainlink" className="h-12 dark:hidden block" />
              </a>
            </div>
          </div>
        </section>

        <section className="py-12 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <img
                  src="https://linea.build/favicon.ico"
                  alt="Linea"
                  className="w-5 h-5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span>Linea Mainnet</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 hover-elevate active-elevate-2 px-2 py-1 rounded-md cursor-pointer"
                  data-testid="button-copy-contract"
                >
                  <span className="font-mono">{truncateAddress(CONTRACT_ADDRESS)}</span>
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <a
                href={`https://explorer.linea.build/address/${CONTRACT_ADDRESS}?tab=contract`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                data-testid="link-explorer"
              >
                View on Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
              <span>Supports millions of claims</span>
            </div>
          </div>
        </section>

        <section className="py-6 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-medium">Security & Transparency</span>
              </div>
              <span>Open-source and verified on Linea</span>
              <a
                href="https://solidityscan.com/blocks/cd6665b9a46ee6d73f7d6f77a5e5deb5/14ba207af1a70caa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
                data-testid="link-solidityscan"
              >
                Automated scan report
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-primary" />
                <span className="font-heading font-semibold">RWA-ID</span>
              </div>
              <p>Decentralized Identity Registry for Real World Assets</p>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/RWA-ID/RWA-ID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                  data-testid="link-github"
                  title="GitHub"
                >
                  <SiGithub className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/rwa_ideth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                  data-testid="link-x"
                  title="X (Twitter)"
                >
                  <SiX className="w-5 h-5" />
                </a>
                <a
                  href="https://github.com/rwa-id/RWA-ID/blob/main/whitepaper.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  data-testid="link-whitepaper"
                  title="White Paper"
                >
                  <FileText className="w-5 h-5" />
                  <span className="hidden sm:inline">White Paper</span>
                </a>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground border-t pt-6">
              <a
                href="mailto:partner@rwa-id.com"
                className="hover:text-foreground transition-colors"
                data-testid="link-contact-email"
              >
                partner@rwa-id.com
              </a>
              <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
