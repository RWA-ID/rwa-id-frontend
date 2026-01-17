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
import { SiGithub, SiX } from "react-icons/si";
import { useState } from "react";
import lineaLogo from "@assets/Wordmark_Blue_BG_1768681663242.png";

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
                  <img src={lineaLogo} alt="Linea" className="h-6 object-contain" />
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
