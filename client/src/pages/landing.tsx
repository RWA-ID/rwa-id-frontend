import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NavBar } from "@/components/nav-bar";
import {
  Building2,
  Shield,
  Upload,
  CheckCircle,
  ExternalLink,
  Copy,
  Layers,
  Fingerprint,
  Zap,
  FileText,
  Send,
  Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiGithub, SiX, SiEthereum, SiPolygon } from "react-icons/si";
import { useState } from "react";
import lineaLogo from "@assets/Wordmark_Blue_BG_1768681663242.png";
import uniswapLogo from "@assets/Uniswap_icon_pink_1771203542816.png";

const CONTRACT_ADDRESS = "0xD0B565C7134bDB16Fc3b8A9Cb5fdA003C37930c2";

export default function Landing() {
  const [copied, setCopied] = useState(false);
  const [contactResult, setContactResult] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [inquiryType, setInquiryType] = useState("");

  const copyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactResult("sending");
    const formData = new FormData(event.currentTarget);
    formData.append("access_key", "c4621259-2059-4c10-8cb4-d6e8cba3d236");
    formData.set("subject", `RWA-ID Inquiry: ${inquiryType || "General"}`);
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      setContactResult("success");
      (event.target as HTMLFormElement).reset();
      setInquiryType("");
    } else {
      setContactResult("error");
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--primary) / 0.18) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10">
        <NavBar />

        <main>

          <section className="relative min-h-[calc(100vh-4rem)] flex items-center py-16 sm:py-24 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 60% at 50% 30%, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
                }}
              />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-sm font-medium mb-8">
                <span>Powered by</span>
                <SiEthereum className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">Ethereum</span>
              </div>

              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
                Decentralized Identity
                <span
                  className="block"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #818cf8 50%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  For Real World Assets
                </span>
                <span className="block">And Client Wallets</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Issue human-readable, ENS-compatible on-chain identities to verified clients — no custody, no personal data, no changes to your existing compliance stack.
              </p>

              <div className="flex flex-wrap gap-4 justify-center mb-16">
                <a href="https://dashboard.rwa-id.com" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="rounded-full px-8 shadow-lg" data-testid="button-launch-dashboard">
                    <Building2 className="mr-2 h-5 w-5" />
                    Launch Dashboard
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="#contact">
                  <Button size="lg" variant="outline" className="rounded-full px-8 border-primary/40 hover:border-primary/70" data-testid="button-contact">
                    Get in Touch
                  </Button>
                </a>
              </div>

              {/* Identity card centered below CTAs */}
              <div className="relative max-w-xs mx-auto">
                {/* Glow halo */}
                <div
                  className="absolute -inset-6 rounded-3xl pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
                    filter: "blur(12px)",
                  }}
                />
                <div
                  className="relative bg-card rounded-2xl border p-6 space-y-4 shadow-xl"
                  style={{
                    borderColor: "hsl(var(--primary) / 0.35)",
                    boxShadow: "0 0 0 1px hsl(var(--primary) / 0.15), 0 20px 60px -12px hsl(var(--primary) / 0.3)",
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-2 ring-primary/20">
                    <Fingerprint className="w-10 h-10 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm text-muted-foreground">yourproject.rwa-id.eth</p>
                    <p className="font-heading text-xl font-semibold mt-2">Verified Identity</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Soulbound or Transferable on Ethereum</span>
                  </div>
                </div>
              </div>
            </div>
          </section>


          <section className="py-8 border-y border-primary/10 bg-primary/5 dark:bg-primary/[0.06]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                  { label: "Live on Ethereum Mainnet", highlight: true },
                  { label: "68 Contract Tests Passing", highlight: false },
                  { label: "25 Top RWA Slugs Reserved", highlight: false },
                  { label: "CCIP-Read Gateway Active", highlight: false },
                  { label: "ENS Wildcard Resolver Live", highlight: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
                      item.highlight
                        ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        item.highlight ? "bg-green-500 animate-pulse" : "bg-primary/50"
                      }`}
                    />
                    <span className={item.highlight ? "font-semibold" : ""}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>


          <section className="py-20 sm:py-28 dark:bg-[hsl(220,39%,10%)] bg-muted/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                  For{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #818cf8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Platforms
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Create your RWA-ID namespace and issue identities to your users at scale
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
                {[
                  { icon: <Layers className="w-7 h-7 text-primary" />, title: "Create Namespace", desc: "Register your unique project slug and establish your identity namespace on-chain" },
                  { icon: <Upload className="w-7 h-7 text-primary" />, title: "Upload Allowlist", desc: "Upload a CSV of names and wallet addresses to generate a Merkle tree" },
                  { icon: <Zap className="w-7 h-7 text-primary" />, title: "Earn Revenue", desc: "Set a claim fee in USDC — 70% goes directly to your treasury on every claim, automatically" },
                ].map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className="relative bg-card rounded-2xl p-6 text-center space-y-4"
                    style={{
                      border: "1px solid hsl(var(--primary) / 0.25)",
                      boxShadow: "0 0 0 1px hsl(var(--primary) / 0.08), inset 0 1px 0 hsl(var(--primary) / 0.1), 0 8px 32px -8px hsl(var(--primary) / 0.2)",
                    }}
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto ring-1 ring-primary/20">
                      {icon}
                    </div>
                    <h3 className="font-heading text-xl font-semibold">{title}</h3>
                    <p className="text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              <div
                className="mt-10 rounded-2xl bg-card p-6 sm:p-8"
                style={{
                  border: "1px solid hsl(var(--primary) / 0.2)",
                  boxShadow: "inset 0 1px 0 hsl(var(--primary) / 0.08)",
                }}
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="font-heading text-xl font-semibold mb-2">Revenue Sharing Model</h3>
                    <p className="text-muted-foreground mb-4">
                      Every identity claim generates revenue split 70/30 on-chain between your treasury and the protocol. A $0.50 minimum is enforced by the contract — even if you set no fee.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Enforced on-chain — no trust required</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left pb-2 font-medium text-muted-foreground">Claim Fee Set</th>
                          <th className="text-right pb-2 font-medium text-muted-foreground">Your Treasury (70%)</th>
                          <th className="text-right pb-2 font-medium text-muted-foreground">Protocol (30%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[
                          { fee: "None (minimum applied)", platform: "$0.35", protocol: "$0.15" },
                          { fee: "$1.00", platform: "$0.70", protocol: "$0.30" },
                          { fee: "$5.00", platform: "$3.50", protocol: "$1.50" },
                        ].map((row) => (
                          <tr key={row.fee}>
                            <td className="py-2.5 text-foreground">{row.fee}</td>
                            <td className="py-2.5 text-right font-medium text-green-600 dark:text-green-400">{row.platform}</td>
                            <td className="py-2.5 text-right text-muted-foreground">{row.protocol}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
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
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-primary/20">
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
                  <div
                    className="absolute -inset-4 rounded-3xl pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.18) 0%, transparent 70%)",
                      filter: "blur(8px)",
                    }}
                  />
                  <div
                    className="relative bg-card rounded-2xl p-6 space-y-5 shadow-xl"
                    style={{
                      border: "1px solid hsl(var(--primary) / 0.3)",
                      boxShadow: "0 0 0 1px hsl(var(--primary) / 0.1), 0 20px 60px -12px hsl(var(--primary) / 0.25)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
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
                      <div className="bg-primary/5 border border-primary/15 rounded-lg px-4 py-3">
                        <p className="font-mono text-primary font-semibold text-center" data-testid="text-example-identity">joe.test.rwa-id.eth</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-muted/50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Type</p>
                        <p className="text-xs font-medium">Configurable</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Network</p>
                        <p className="text-xs font-medium">Ethereum</p>
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


          <section className="py-20 sm:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                    For{" "}
                    <span
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #818cf8 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      Users
                    </span>
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Claim your verified on-chain identity through your RWA platform
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Your platform provides you with a unique claim URL",
                      "Connect your wallet and your identity is automatically detected",
                      "Approve any claim fee and sign the transaction",
                      "Receive your resolved name: name.slug.rwa-id.eth",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-primary/20">
                          <CheckCircle className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="bg-card rounded-2xl p-6 sm:p-8"
                  style={{
                    border: "1px solid hsl(var(--primary) / 0.2)",
                    boxShadow: "0 0 0 1px hsl(var(--primary) / 0.08), 0 8px 32px -8px hsl(var(--primary) / 0.15)",
                  }}
                >
                  <div className="space-y-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-2 ring-primary/20">
                      <Fingerprint className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading text-xl font-semibold mb-2">How Do I Claim?</p>
                      <p className="text-muted-foreground">
                        Your RWA platform will provide you with a claim link once your identity has been assigned. Simply open the link, connect your wallet, and claim your on-chain identity token — soulbound or transferable depending on your platform's configuration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>


          <section className="py-20 sm:py-28 dark:bg-[hsl(220,39%,10%)] bg-muted/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                  Platform{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #818cf8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Dashboard
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Full project management from a single interface — no backend, no indexer, all reads go directly to the contract
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: "Live Project Stats",
                    desc: "View total claimed identities, total revenue earned, current claim fee, treasury address, and active/paused status in real time.",
                  },
                  {
                    title: "Allowlist Management",
                    desc: "Upload a CSV or add entries manually. Load an existing tree from IPFS to extend it without losing any previous entries.",
                  },
                  {
                    title: "Update Claim Fee",
                    desc: "Adjust the per-claim USDC fee at any time. The contract enforces the $0.50 protocol minimum automatically.",
                  },
                  {
                    title: "Treasury Control",
                    desc: "Update the wallet address that receives your 70% revenue share from each claim with a single on-chain transaction.",
                  },
                  {
                    title: "Transferability Override",
                    desc: "Set soulbound or transferable at the project level — and override it on individual tokens if needed.",
                  },
                  {
                    title: "Identity Lookup & Revoke",
                    desc: "Search any claimed identity by name, see its status on-chain, and permanently revoke it to burn the token and blacklist the name.",
                  },
                  {
                    title: "Pause & Unpause",
                    desc: "Freeze new claims at any time while keeping all existing identities intact. Unpause when ready to re-open.",
                  },
                  {
                    title: "Transfer Ownership",
                    desc: "Hand off project admin rights to any wallet address — the new owner gains full control immediately.",
                  },
                  {
                    title: "Shareable Claim URLs",
                    desc: "After uploading an allowlist, a unique claim URL is generated automatically to share with your clients.",
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="bg-card rounded-xl p-5 space-y-2"
                    style={{
                      border: "1px solid hsl(var(--primary) / 0.2)",
                      boxShadow: "0 0 0 1px hsl(var(--primary) / 0.06), inset 0 1px 0 hsl(var(--primary) / 0.08)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <h3 className="font-heading font-semibold text-sm">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <a href="https://dashboard.rwa-id.com" target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-full px-8" data-testid="button-dashboard-cta">
                    <Building2 className="mr-2 h-4 w-4" />
                    Open Platform Dashboard
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </section>


          <section className="py-20 sm:py-28">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-center mb-10">
                How It{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #818cf8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Works
                </span>
              </h2>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem
                  value="merkle"
                  className="bg-card rounded-xl px-6"
                  style={{ border: "1px solid hsl(var(--primary) / 0.2)" }}
                >
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
                <AccordionItem
                  value="soulbound"
                  className="bg-card rounded-xl px-6"
                  style={{ border: "1px solid hsl(var(--primary) / 0.2)" }}
                >
                  <AccordionTrigger className="text-left font-semibold" data-testid="accordion-soulbound">
                    What are Soulbound Tokens?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    Soulbound tokens (SBTs) are non-transferable NFTs that represent identity,
                    credentials, or affiliations. Once claimed, they are permanently bound to
                    your wallet address and cannot be sold or transferred.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="leaf"
                  className="bg-card rounded-xl px-6"
                  style={{ border: "1px solid hsl(var(--primary) / 0.2)" }}
                >
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
                <AccordionItem
                  value="csv"
                  className="bg-card rounded-xl px-6"
                  style={{ border: "1px solid hsl(var(--primary) / 0.2)" }}
                >
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
                <AccordionItem
                  value="claiming"
                  className="bg-card rounded-xl px-6"
                  style={{ border: "1px solid hsl(var(--primary) / 0.2)" }}
                >
                  <AccordionTrigger className="text-left font-semibold" data-testid="accordion-claiming">
                    How Do Users Claim Their Identity?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    <p className="mb-2">
                      After a platform uploads its allowlist and sets the Merkle root on-chain, a unique claim URL is generated. The platform shares this URL with its users.
                    </p>
                    <p>
                      Users simply open the link, connect their wallet, and their identity is automatically detected from the proof file stored on IPFS. If a claim fee is set, they approve the USDC spend and then claim their identity token in a single flow — soulbound or transferable as configured by the platform.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="revenue"
                  className="bg-card rounded-xl px-6"
                  style={{ border: "1px solid hsl(var(--primary) / 0.2)" }}
                >
                  <AccordionTrigger className="text-left font-semibold" data-testid="accordion-revenue">
                    How Does the Revenue Model Work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    <p className="mb-2">
                      Every identity claim pays a fee in USDC that is split 70/30 on-chain: 70% goes directly to the platform's treasury wallet, and 30% goes to the RWA ID protocol.
                    </p>
                    <p className="mb-2">
                      Platforms set their own claim fee. A $0.50 minimum is enforced at the contract level — it cannot be bypassed. If a platform sets no fee, the contract applies the $0.50 minimum and distributes it with the same 70/30 split ($0.35 to the platform, $0.15 to the protocol).
                    </p>
                    <p>
                      The split is automatic and trustless — no manual payouts, no intermediaries.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>


          <section className="py-20 sm:py-28 dark:bg-[hsl(220,39%,10%)] bg-muted/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                  Cross-Chain Name{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #818cf8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Resolution
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  RWA ID names resolve across major blockchains and wallets via Chainlink CCIP
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div
                  className="bg-card rounded-2xl p-6"
                  style={{
                    border: "1px solid hsl(var(--primary) / 0.2)",
                    boxShadow: "0 0 0 1px hsl(var(--primary) / 0.06)",
                  }}
                >
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
                </div>

                <div
                  className="bg-card rounded-2xl p-6"
                  style={{
                    border: "1px solid hsl(var(--primary) / 0.2)",
                    boxShadow: "0 0 0 1px hsl(var(--primary) / 0.06)",
                  }}
                >
                  <h3 className="font-heading text-lg font-semibold mb-5">Native Wallet Support</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "MetaMask", icon: <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none"><path d="M36.08 3.36L22.16 13.68l2.56-6.08L36.08 3.36z" fill="#E2761B" stroke="#E2761B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.92 3.36l13.76 10.4-2.4-6.16L3.92 3.36zM31.04 27.44l-3.68 5.68 7.88 2.16 2.28-7.72-6.48-.12zM2.52 27.56l2.24 7.72 7.88-2.16-3.68-5.68-6.44.12z" fill="#E4761B" stroke="#E4761B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M12.32 17.32l-2.2 3.36 7.84.36-.28-8.44-5.36 4.72zM27.68 17.32l-5.44-4.8-.2 8.52 7.84-.36-2.2-3.36zM12.64 33.12l4.72-2.32-4.08-3.2-.64 5.52zM22.64 30.8l4.72 2.32-.64-5.52-4.08 3.2z" fill="#E4761B" stroke="#E4761B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M27.36 33.12l-4.72-2.32.38 3.08-.04 1.3 4.38-2.06zM12.64 33.12l4.38 2.06-.04-1.3.38-3.08-4.72 2.32z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M17.08 26.16l-3.92-1.16 2.76-1.28 1.16 2.44zM22.92 26.16l1.16-2.44 2.8 1.28-3.96 1.16z" fill="#233447" stroke="#233447" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M12.64 33.12l.68-5.68-4.36.12 3.68 5.56zM26.68 27.44l.68 5.68 3.68-5.56-4.36-.12zM29.88 20.68l-7.84.36.72 4.04 1.16-2.44 2.8 1.28 3.16-3.24zM13.16 23.92l2.8-1.28 1.16 2.44.72-4.04-7.84-.36 3.16 3.24z" fill="#CD6116" stroke="#CD6116" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 20.68l3.28 6.4-.12-3.16L10 20.68zM26.84 23.92l-.12 3.16 3.28-6.4-3.16 3.24zM17.84 21.04l-.72 4.04.92 4.68.2-6.16-.4-2.56zM22.04 21.04l-.4 2.52.2 6.2.92-4.68-.72-4.04z" fill="#E4751F" stroke="#E4751F" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M22.76 25.08l-.92 4.68.64.44 4.08-3.2.12-3.16-3.92 1.24zM13.16 23.84l.12 3.16 4.08 3.2.64-.44-.92-4.68-3.92-1.24z" fill="#F6851B" stroke="#F6851B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M17.46 35.18l.04-1.3-.34-.28h-4.52l-.32.28.04 1.3-4.38-2.06 1.52 1.24 3.12 2.16h5.36l3.12-2.16 1.52-1.24-4.16 2.06zM22.64 30.8l-.64-.44h-3.96l-.64.44-.38 3.08.32-.28h4.52l.34.28-.56-3.08z" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M36.64 14.28l1.2-5.76-1.76-5.16-13.44 9.96 5.16 4.36 7.28 2.16 1.64-1.88-.68-.52 1.12-1 -.84-.64 1.12-.88-.8-.6zM2.16 8.52l1.2 5.76-.76.56 1.12.88-.84.64 1.12 1-.68.52 1.6 1.88 7.28-2.16 5.16-4.36L3.92 3.36 2.16 8.52z" fill="#763D16" stroke="#763D16" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/><path d="M35.08 19.8l-7.28-2.16 2.2 3.36-3.28 6.4 4.28-.04h6.44l-2.36-7.56zM12.2 17.64L4.92 19.8l-2.36 7.56h6.44l4.28.04-3.28-6.4 2.2-3.36zM22.04 21.04l.48-8.12 2.12-5.72h-9.28l2.12 5.72.48 8.12.16 2.6.04 6.12h3.96l.04-6.16.16-2.56z" fill="#F6851B" stroke="#F6851B" strokeWidth=".24" strokeLinecap="round" strokeLinejoin="round"/></svg> },
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
                </div>
              </div>

              <div className="flex justify-center mt-10">
                <a href="https://chain.link/" target="_blank" rel="noopener noreferrer" data-testid="link-chainlink-badge">
                  <img src="https://chain.link/badge-cross-chain-white" alt="CCIP secured with Chainlink" className="h-12 dark:block hidden" />
                  <img src="https://chain.link/badge-cross-chain-black" alt="CCIP secured with Chainlink" className="h-12 dark:hidden block" />
                </a>
              </div>
            </div>
          </section>


          <section className="py-20 sm:py-28">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                  Infrastructure{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #818cf8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Only
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  RWA ID operates with minimal regulatory surface area. We provide the rails — your existing compliance stack stays untouched.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">What RWA ID Does</p>
                  {[
                    "Provides human-readable identity references",
                    "Enables name resolution across wallets and dApps",
                    "Facilitates on-chain identity registration",
                    "Supports platform operations and revenue sharing",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">What RWA ID Does NOT Do</p>
                  {[
                    "Collect or store personal data",
                    "Perform KYC or identity verification",
                    "Assert or validate identity claims",
                    "Custody funds or assets",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center">
                        <div className="w-3 h-0.5 bg-muted-foreground/40 rounded" />
                      </div>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>


          <section id="contact" className="py-20 sm:py-28 dark:bg-[hsl(220,39%,10%)] bg-muted/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-sm font-medium mb-6">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-primary font-semibold">Work With Us</span>
                </div>
                <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                  Get in{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)) 0%, #818cf8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Touch
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Interested in integrating RWA-ID into your platform? We'd love to hear from you — whether it's a partnership, demo request, collaboration, or just a question.
                </p>
              </div>

              <div
                className="bg-card rounded-2xl shadow-xl"
                style={{
                  border: "1px solid hsl(var(--primary) / 0.2)",
                  boxShadow: "0 0 0 1px hsl(var(--primary) / 0.08), 0 20px 60px -16px hsl(var(--primary) / 0.2)",
                }}
              >
                <div className="p-6 sm:p-8">
                  {contactResult === "success" ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto ring-2 ring-green-500/20">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="font-heading text-xl font-semibold">Message Sent!</h3>
                      <p className="text-muted-foreground">Thanks for reaching out. We'll get back to you at the email you provided.</p>
                      <Button variant="outline" onClick={() => setContactResult("idle")} data-testid="button-send-another">
                        Send another message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact-name">Name <span className="text-destructive">*</span></Label>
                          <Input
                            id="contact-name"
                            name="name"
                            placeholder="Jane Smith"
                            required
                            data-testid="input-contact-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-email">Email <span className="text-destructive">*</span></Label>
                          <Input
                            id="contact-email"
                            name="email"
                            type="email"
                            placeholder="jane@yourplatform.com"
                            required
                            data-testid="input-contact-email"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact-org">Organization</Label>
                          <Input
                            id="contact-org"
                            name="organization"
                            placeholder="Your platform or company"
                            data-testid="input-contact-org"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-type">Inquiry Type <span className="text-destructive">*</span></Label>
                          <Select
                            value={inquiryType}
                            onValueChange={setInquiryType}
                            required
                          >
                            <SelectTrigger id="contact-type" data-testid="select-contact-type">
                              <SelectValue placeholder="Select inquiry type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Partnership">Partnership</SelectItem>
                              <SelectItem value="Demo Request">Demo Request</SelectItem>
                              <SelectItem value="Collaboration">Collaboration</SelectItem>
                              <SelectItem value="Integration Support">Integration Support</SelectItem>
                              <SelectItem value="General Question">General Question</SelectItem>
                            </SelectContent>
                          </Select>
                          <input type="hidden" name="inquiry_type" value={inquiryType} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-message">Message <span className="text-destructive">*</span></Label>
                        <Textarea
                          id="contact-message"
                          name="message"
                          placeholder="Tell us about your platform and how you'd like to work together..."
                          rows={5}
                          required
                          data-testid="textarea-contact-message"
                        />
                      </div>

                      {contactResult === "error" && (
                        <p className="text-sm text-destructive" data-testid="text-contact-error">
                          Something went wrong. Please try again or email us directly at partner@rwa-id.com
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <p className="text-sm text-muted-foreground">
                          Or email us directly at{" "}
                          <a href="mailto:partner@rwa-id.com" className="text-primary hover:underline">
                            partner@rwa-id.com
                          </a>
                        </p>
                        <Button
                          type="submit"
                          disabled={contactResult === "sending" || !inquiryType}
                          className="rounded-full px-8"
                          data-testid="button-submit-contact"
                        >
                          {contactResult === "sending" ? (
                            "Sending..."
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>


          <section className="py-10 border-t border-border/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <SiEthereum className="w-5 h-5 text-primary" />
                  <span>Ethereum Mainnet</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-1.5 rounded-lg cursor-pointer border border-border/60 bg-card font-mono text-xs"
                    data-testid="button-copy-contract"
                  >
                    <span>{truncateAddress(CONTRACT_ADDRESS)}</span>
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <a
                  href={`https://etherscan.io/address/${CONTRACT_ADDRESS}#code`}
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


          <section className="py-5 dark:bg-[hsl(220,39%,10%)] bg-muted/20 border-t border-border/40">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Security &amp; Transparency</span>
                </div>
                <span>Open-source and verified on Ethereum</span>
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


        <footer className="border-t border-border/60 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-6 w-6 text-primary" />
                  <span className="font-heading font-bold text-base text-foreground tracking-tight">RWA-ID</span>
                </div>
                <p className="max-w-xs text-center sm:text-left">Decentralized Identity Registry for Real World Assets</p>
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
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground border-t border-border/40 pt-6">
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
    </div>
  );
}
