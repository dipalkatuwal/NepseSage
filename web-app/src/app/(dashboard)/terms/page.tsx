import Link from "next/link";

const LAST_UPDATED = "May 22, 2025";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl w-full pb-16 space-y-8">

      {/* Header */}
      <div className="pt-8">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">Legal</p>
        <h1 className="font-heading text-4xl font-bold leading-tight mb-2">Terms of Service</h1>
        <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        By accessing or using NepseSage ("the platform"), you agree to be bound by
        these Terms of Service. Please read them carefully before using the platform.
        If you do not agree, do not use the platform.
      </p>

      {/* Important disclaimer box */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4">
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Important disclaimer</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          NepseSage is an <strong className="text-foreground">informational and analytical tool only</strong>.
          Nothing on this platform constitutes financial, investment, legal, or tax advice.
          All investment decisions are entirely your own responsibility. We are not a licensed
          financial advisor, broker, or investment firm. Always consult a qualified professional
          before making financial decisions.
        </p>
      </div>

      {[
        {
          title: "1. Acceptance of terms",
          content: [
            {
              subtitle: "Agreement",
              text: "By creating an account or browsing the platform, you confirm that you are at least 18 years old and agree to these Terms of Service and our Privacy Policy.",
            },
          ],
        },
        {
          title: "2. Description of service",
          content: [
            {
              subtitle: "What we provide",
              text: "NepseSage provides market data, portfolio tracking, AI-powered analysis, a trading journal, a paper trading simulator, and community features for Nepal Stock Exchange (NEPSE) investors.",
            },
            {
              subtitle: "Data accuracy",
              text: "We strive to provide accurate and timely market data, but we do not guarantee that any data, analysis, or AI-generated content is complete, accurate, or up-to-date. Market data may be delayed. Do not rely solely on our platform for trading decisions.",
            },
          ],
        },
        {
          title: "3. User accounts",
          content: [
            {
              subtitle: "Account responsibility",
              text: "You are responsible for maintaining the confidentiality of your login credentials. Any activity that occurs under your account is your responsibility. Notify us immediately if you suspect unauthorised access.",
            },
            {
              subtitle: "Accurate information",
              text: "You agree to provide accurate information when creating your account and to keep it up to date.",
            },
            {
              subtitle: "One account per user",
              text: "You may not create multiple accounts to circumvent plan limits or restrictions.",
            },
          ],
        },
        {
          title: "4. Free and Pro plans",
          content: [
            {
              subtitle: "Free plan",
              text: "Free accounts have access to the core features of the platform as described on the Upgrade page. We reserve the right to modify the features included in the free plan at any time.",
            },
            {
              subtitle: "Pro plan",
              text: "Pro subscriptions are billed monthly or annually as selected at checkout. Prices are in NPR and are subject to change with advance notice.",
            },
            {
              subtitle: "Cancellation and refunds",
              text: "You may cancel your Pro subscription at any time from Settings. You will retain Pro access until the end of your current billing period. We do not offer refunds for partial billing periods unless required by applicable law.",
            },
          ],
        },
        {
          title: "5. No financial advice",
          content: [
            {
              subtitle: "Informational purpose only",
              text: "All content on NepseSage — including AI-generated analysis, Sage Intelligence cards, Opportunity Radar signals, portfolio analytics, and community insights — is provided for informational and educational purposes only.",
            },
            {
              subtitle: "No liability for trading losses",
              text: "We are not liable for any financial losses incurred as a result of trading decisions made using information from this platform. Investing in NEPSE involves risk, including the potential loss of principal.",
            },
          ],
        },
        {
          title: "6. Acceptable use",
          content: [
            {
              subtitle: "Prohibited activities",
              text: "You agree not to: use the platform for any unlawful purpose; attempt to reverse-engineer, scrape, or copy data from the platform at scale; share your account with others; use bots or automated tools to interact with the platform; post harmful, misleading, or abusive content in community features.",
            },
            {
              subtitle: "Community content",
              text: "Content you post in Insights and community features must be your own, accurate to the best of your knowledge, and not misleading to other investors. We reserve the right to remove any content that violates these terms.",
            },
          ],
        },
        {
          title: "7. Intellectual property",
          content: [
            {
              subtitle: "Platform ownership",
              text: "All software, design, branding, and content on NepseSage is the intellectual property of Dipal Katuwal. You may not copy, reproduce, or redistribute any part of the platform without written permission.",
            },
            {
              subtitle: "Your data",
              text: "You retain ownership of the data you enter into the platform (transactions, journal entries, etc.). By using the platform, you grant us a limited licence to store and process this data to provide the service.",
            },
          ],
        },
        {
          title: "8. Availability and changes",
          content: [
            {
              subtitle: "Service availability",
              text: "We aim for high availability but do not guarantee uninterrupted access. We may perform maintenance, updates, or experience downtime beyond our control.",
            },
            {
              subtitle: "Changes to the service",
              text: "We reserve the right to modify, suspend, or discontinue any part of the platform at any time. We will provide reasonable notice for significant changes where possible.",
            },
          ],
        },
        {
          title: "9. Limitation of liability",
          content: [
            {
              subtitle: "Limitation",
              text: "To the maximum extent permitted by law, NepseSage and its creator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or investment capital, arising from your use of the platform.",
            },
          ],
        },
        {
          title: "10. Governing law",
          content: [
            {
              subtitle: "Jurisdiction",
              text: "These Terms are governed by the laws of Nepal. Any disputes arising from these Terms shall be subject to the jurisdiction of the courts of Nepal.",
            },
          ],
        },
        {
          title: "11. Changes to these terms",
          content: [
            {
              subtitle: "Updates",
              text: "We may update these Terms of Service from time to time. The \"Last updated\" date will reflect any changes. Continued use of the platform after changes constitutes your acceptance of the updated terms.",
            },
          ],
        },
        {
          title: "12. Contact",
          content: [
            {
              subtitle: "Questions",
              text: "If you have questions about these Terms, please use the Support section in Settings or contact us via dipalkatuwal.com.np.",
            },
          ],
        },
      ].map(({ title, content }) => (
        <div key={title} className="space-y-3">
          <h2 className="font-heading text-base font-bold">{title}</h2>
          {content.map(({ subtitle, text }) => (
            <div key={subtitle} className="pl-4 border-l-2 border-border space-y-1">
              <p className="text-sm font-semibold">{subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      ))}

      <div className="pt-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border">
        <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
      </div>
    </div>
  );
}
