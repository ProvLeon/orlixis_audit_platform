import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  BarChart3,
  Zap,
  GitBranch,
  FileSearch,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function HomePage() {
  return (
    <main className="bg-background text-foreground">
      {/* Top Banner */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-orlixis-subtle" />
        <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Image
                src="/orlixis_logomark.png"
                alt="Orlixis"
                width={28}
                height={28}
                className="rounded-md"
                priority
              />
              <span className="font-semibold tracking-tight">Orlixis Audit Platform</span>
            </div>
            <nav className="hidden items-center gap-6 text-sm md:flex">
              <a href="#features" className="hover:text-orlixis-teal transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-orlixis-teal transition-colors">How it works</a>
              <a href="#security" className="hover:text-orlixis-teal transition-colors">Security</a>
              <a href="#faq" className="hover:text-orlixis-teal transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="hidden rounded-md border border-orlixis-teal/40 px-4 py-2 text-sm hover:border-orlixis-teal hover:text-orlixis-teal md:inline-block"
              >
                Sign in
              </Link>
              <Link
                href="/projects/upload"
                className="rounded-md bg-orlixis-teal px-4 py-2 text-sm font-medium text-white shadow-orlixis hover:shadow-orlixis-lg transition-shadow"
              >
                Start Audit
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative z-10">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div className="space-y-6">
              {/*<div className="inline-flex items-center gap-2 rounded-full border border-orlixis-teal/30 bg-background/60 px-3 py-1 text-xs text-foreground/80">
                <span className="inline-block h-2 w-2 rounded-full bg-orlixis-teal" />
                Enterprise-grade codebase auditing
              </div>*/}
              <h1 className="text-balance text-4xl font-extrabold leading-tight sm:text-5xl">
                Audit your codebase with confidence and clarity
              </h1>
              <p className="text-pretty text-foreground/80">
                Orlixis analyzes your repositories for vulnerabilities, code quality, architectural risks, and compliance—then produces professional reports your team can act on.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/projects/upload"
                  className="rounded-md bg-orlixis-teal px-5 py-3 text-sm font-semibold text-white shadow-orlixis hover:shadow-orlixis-lg transition-shadow"
                >
                  Run a quick audit
                </Link>
                <Link
                  href="/auth/signin"
                  className="rounded-md border border-orlixis-teal/40 px-5 py-3 text-sm font-semibold hover:border-orlixis-teal hover:text-orlixis-teal transition-colors"
                >
                  Sign in with GitHub
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-border bg-background/50 p-4">
                <div>
                  <div className="text-xl font-bold">1M+</div>
                  <div className="text-xs text-foreground/70">Findings analyzed</div>
                </div>
                <div>
                  <div className="text-xl font-bold">50K+</div>
                  <div className="text-xs text-foreground/70">Repositories audited</div>
                </div>
                <div>
                  <div className="text-xl font-bold">99.9%</div>
                  <div className="text-xs text-foreground/70">Uptime SLA</div>
                </div>
              </div>
            </div>

            {/* Visual Panel */}
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-orlixis opacity-20 blur-2xl" />
              <div className="rounded-2xl border border-border bg-background shadow-orlixis-lg">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-orlixis-teal" />
                    <span className="text-sm font-medium">Audit Summary</span>
                  </div>
                  <span className="rounded-full bg-orlixis-teal/10 px-2 py-1 text-xs text-orlixis-teal">Live</span>
                </div>
                <div className="grid gap-0 p-4 sm:grid-cols-2">
                  <div className="space-y-3 border-b border-border pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-orlixis-teal" />
                      <div className="text-sm font-medium">Security posture</div>
                    </div>
                    <div className="rounded-lg border border-orlixis-teal/30 bg-background p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>High severity</span>
                        <span className="font-semibold">0</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span>Medium severity</span>
                        <span className="font-semibold">3</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span>Low severity</span>
                        <span className="font-semibold">12</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 sm:pl-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-orlixis-teal" />
                      <div className="text-sm font-medium">Code quality</div>
                    </div>
                    <div className="rounded-lg border border-orlixis-teal/30 bg-background p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Maintainability</span>
                        <span className="font-semibold">A-</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span>Complexity</span>
                        <span className="font-semibold">Low</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span>Coverage</span>
                        <span className="font-semibold">78%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-orlixis-teal" />
                    <span>main • 1,284 commits • 34 contributors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orlixis-teal" />
                    <span>Report generated in 12s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Everything you need to ship securely</h2>
          <p className="mt-3 text-foreground/80">
            From vulnerability detection to comprehensive reporting—Orlixis streamlines your audit workflow end-to-end.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<FileSearch className="h-5 w-5 text-orlixis-teal" />}
            title="Deep repository analysis"
            desc="Analyzes structure, dependencies, secrets, and configuration for common pitfalls."
          />
          <Feature
            icon={<Shield className="h-5 w-5 text-orlixis-teal" />}
            title="Security-first findings"
            desc="Detects risks across auth, input handling, SSRF, data exposure, and more."
          />
          <Feature
            icon={<BarChart3 className="h-5 w-5 text-orlixis-teal" />}
            title="Actionable reports"
            desc="Professional outputs for stakeholders with remediation steps and prioritization."
          />
          <Feature
            icon={<GitBranch className="h-5 w-5 text-orlixis-teal" />}
            title="GitHub-native workflow"
            desc="Connect in seconds. Audit branches and PRs without changing your stack."
          />
          <Feature
            icon={<Lock className="h-5 w-5 text-orlixis-teal" />}
            title="Privacy by design"
            desc="Granular scopes and ephemeral processing. Your data stays under your control."
          />
          <Feature
            icon={<Zap className="h-5 w-5 text-orlixis-teal" />}
            title="Fast and scalable"
            desc="Optimized pipelines deliver insights in seconds—even for large monorepos."
          />
        </div>
      </section>

      {/* Integrations */}
      <section aria-labelledby="integrations" className="border-t border-border bg-background/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="integrations" className="text-2xl font-semibold sm:text-3xl">Seamless integrations</h2>
            <p className="mt-2 text-foreground/80">Connect your existing tooling in minutes.</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {["GitHub", "Vercel", "Supabase", "Prisma", "Next.js"].map((name) => (
              <div key={name} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background p-3">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orlixis-teal/10">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-orlixis-teal" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-border bg-background/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">From code to clarity in minutes</h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Step
              index={1}
              title="Connect your repo"
              desc="Sign in with GitHub and select the repository or branch to audit."
            />
            <Step
              index={2}
              title="Run the analysis"
              desc="We scan code quality, vulnerabilities, and configuration using best practices."
            />
            <Step
              index={3}
              title="Review the report"
              desc="Share professional summaries, prioritize issues, and ship fixes with confidence."
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/signin"
              className="rounded-md bg-orlixis-teal px-5 py-3 text-sm font-semibold text-white shadow-orlixis hover:shadow-orlixis-lg transition-shadow"
            >
              Get started free
            </Link>
            <Link
              href="/projects"
              className="rounded-md border border-orlixis-teal/40 px-5 py-3 text-sm font-semibold hover:border-orlixis-teal hover:text-orlixis-teal transition-colors"
            >
              Explore projects
            </Link>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-orlixis-teal/30 px-3 py-1 text-xs text-foreground/80">
            <Lock className="h-3.5 w-3.5 text-orlixis-teal" />
            Security & Privacy
          </div>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Built with privacy and trust in mind</h2>
          <p className="mt-3 text-foreground/80">
            Orlixis uses granular GitHub scopes, short-lived tokens, and ephemeral workers. Reports are yours to keep, data is never used to train external systems, and access is fully auditable.
          </p>

          <ul className="mt-6 space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-orlixis-teal" />
              <span>Principle of least privilege and scoped integrations</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-orlixis-teal" />
              <span>Data encrypted in transit and at rest</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-orlixis-teal" />
              <span>Organization-level controls and audit logs</span>
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-background/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
            <div className="mt-8 divide-y divide-border rounded-xl border border-border">
              <FAQ
                q="Which languages and frameworks are supported?"
                a="We analyze common languages and frameworks across modern web stacks, with a focus on security-sensitive patterns and configuration. Multi-language monorepos are supported."
              />
              <FAQ
                q="Can we export or share reports?"
                a="Yes. Reports are shareable across your organization and can be exported for stakeholders and compliance workflows."
              />
              <FAQ
                q="How long does an audit take?"
                a="Most repositories produce an initial report in seconds to a couple of minutes depending on size and history."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section aria-labelledby="cta" className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-orlixis-teal/30 bg-orlixis-teal/10 p-6 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 id="cta" className="text-2xl font-bold">Ready to audit your codebase?</h2>
                <p className="mt-2 text-foreground/80">Run an analysis now and receive a professional report in minutes.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/projects/upload" className="rounded-md bg-orlixis-teal px-5 py-3 text-sm font-semibold text-white shadow-orlixis hover:shadow-orlixis-lg transition-shadow">
                  Start Audit
                </Link>
                <Link href="/auth/signin" className="rounded-md border border-orlixis-teal/40 px-5 py-3 text-sm font-semibold hover:border-orlixis-teal hover:text-orlixis-teal transition-colors">
                  Sign in with GitHub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-foreground/70 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Image
              src="/orlixis_logomark.png"
              alt="Orlixis"
              width={20}
              height={20}
              className="rounded-sm"
            />
            <span>© {new Date().getFullYear()} Orlixis LTD</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-orlixis-teal transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-orlixis-teal transition-colors">
              Privacy
            </Link>
            <Link href="/security" className="hover:text-orlixis-teal transition-colors">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-background p-5 transition-shadow hover:shadow-orlixis">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-orlixis-teal/10 p-2">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-foreground/80">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function Step({
  index,
  title,
  desc,
}: {
  index: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orlixis-teal/10 text-sm font-semibold text-orlixis-teal">
          {index}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-foreground/80">{desc}</p>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group px-6 py-5 open:bg-background/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
        <span>{q}</span>
        <svg
          className="h-5 w-5 text-orlixis-teal transition-transform group-open:rotate-180"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.176l3.71-3.945a.75.75 0 111.08 1.04l-4.25 4.518a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <p className="mt-3 text-sm text-foreground/80">{a}</p>
      <div className="mt-5 h-px w-full bg-gradient-orlixis opacity-20" />
    </details>
  );
}
