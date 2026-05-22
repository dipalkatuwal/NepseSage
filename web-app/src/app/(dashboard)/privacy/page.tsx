import Link from "next/link";

const LAST_UPDATED = "May 22, 2025";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl w-full pb-16 space-y-8">

      {/* Header */}
      <div className="pt-8">
        <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-3">Legal</p>
        <h1 className="font-heading text-4xl font-bold leading-tight mb-2">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        NepseSage ("we", "our", or "us") is committed to protecting your privacy.
        This Privacy Policy explains how we collect, use, and safeguard your information
        when you use our platform at nepsesage.com and related services.
      </p>

      {[
        {
          title: "1. Information we collect",
          content: [
            {
              subtitle: "Account information",
              text: "When you create an account, we collect your name and email address. Passwords are hashed using industry-standard bcrypt and are never stored in plain text.",
            },
            {
              subtitle: "Portfolio and transaction data",
              text: "We store the portfolio holdings, buy/sell transactions, and journal entries you add to the platform. This data is tied to your account and used to power your dashboard, analytics, and AI features.",
            },
            {
              subtitle: "Usage data",
              text: "We may collect anonymous usage information such as pages visited, features used, and session duration to improve the platform. This data is not linked to your identity.",
            },
            {
              subtitle: "Watchlist and preferences",
              text: "Your watchlist symbols, theme preference, risk tolerance, and other settings are stored to personalise your experience.",
            },
          ],
        },
        {
          title: "2. How we use your information",
          content: [
            {
              subtitle: "To provide the service",
              text: "Your account and portfolio data are used to power the dashboard, Sage AI analysis, trading journal, and all other features of the platform.",
            },
            {
              subtitle: "To improve the platform",
              text: "Anonymised usage data helps us understand which features are valuable and where we can improve the experience.",
            },
            {
              subtitle: "To communicate with you",
              text: "We may send you account-related emails such as password resets or important service notices. We do not send unsolicited marketing emails.",
            },
          ],
        },
        {
          title: "3. Data sharing",
          content: [
            {
              subtitle: "We do not sell your data",
              text: "We will never sell, rent, or trade your personal information to third parties for marketing purposes.",
            },
            {
              subtitle: "Third-party services",
              text: "We use third-party services to operate the platform (such as MongoDB Atlas for database hosting). These providers process data on our behalf and are bound by their own privacy policies.",
            },
            {
              subtitle: "Legal requirements",
              text: "We may disclose your information if required by law or in response to valid legal process.",
            },
          ],
        },
        {
          title: "4. Data security",
          content: [
            {
              subtitle: "Security measures",
              text: "We use HTTPS encryption for all data in transit, bcrypt hashing for passwords, and JWT-based authentication with expiring tokens. No system is completely secure, and we cannot guarantee absolute security.",
            },
          ],
        },
        {
          title: "5. Data retention",
          content: [
            {
              subtitle: "Account data",
              text: "We retain your account and portfolio data for as long as your account is active. If you delete your account, your data will be removed from our systems within 30 days.",
            },
          ],
        },
        {
          title: "6. Your rights",
          content: [
            {
              subtitle: "Access and correction",
              text: "You can view and update your account information at any time from the Settings page.",
            },
            {
              subtitle: "Deletion",
              text: "You may request deletion of your account and all associated data by contacting us. We will process your request within 30 days.",
            },
          ],
        },
        {
          title: "7. Cookies",
          content: [
            {
              subtitle: "Local storage",
              text: "We use browser local storage to persist your authentication session and theme preference. We do not use third-party tracking cookies or advertising cookies.",
            },
          ],
        },
        {
          title: "8. Children's privacy",
          content: [
            {
              subtitle: "Age restriction",
              text: "NepseSage is not intended for users under the age of 18. We do not knowingly collect personal information from minors.",
            },
          ],
        },
        {
          title: "9. Changes to this policy",
          content: [
            {
              subtitle: "Updates",
              text: "We may update this Privacy Policy from time to time. The \"Last updated\" date at the top of this page will reflect any changes. Continued use of the platform after changes constitutes your acceptance of the updated policy.",
            },
          ],
        },
        {
          title: "10. Contact",
          content: [
            {
              subtitle: "Get in touch",
              text: "If you have any questions about this Privacy Policy, please contact us through the Support section in Settings, or reach out via the contact details on dipalkatuwal.com.np.",
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
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
      </div>
    </div>
  );
}
