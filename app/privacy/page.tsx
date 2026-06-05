import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Privacy Policy — Free Construction Tools",
  description:
    "How Free Construction Tools handles data: calculators run locally in your browser, what cookies and third-party advertising (Google AdSense) we use, and how to opt out.",
  alternates: { canonical: "https://freeconstructiontools.com/privacy" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "June 5, 2026";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1">
        <Breadcrumbs />
        <section className="border-b border-zinc-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <Badge variant="neutral" className="mb-4">
              <ShieldCheck className="w-3 h-3" />
              Legal
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-950 tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <section>
          <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8 text-zinc-700 leading-relaxed">
            <p>
              This Privacy Policy explains how Free Construction Tools
              (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or the &ldquo;Site&rdquo;), available at
              freeconstructiontools.com, handles information when you use our free construction
              calculators. By using the Site, you agree to the practices described here.
            </p>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">The short version</h2>
              <p>
                Our calculators run entirely in your browser. The measurements and values you
                enter are processed on your device and are <strong>not</strong> transmitted to
                or stored on our servers. We do not require an account, and we do not ask for
                your name, email, or any personal details to use the tools.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Information we collect</h2>
              <p>
                We do not collect personal information directly. We do not operate user
                accounts, newsletters, or logins. The only information involved comes from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Calculator inputs</strong> — handled locally in your browser and never
                  sent to us. Some tools may use your browser&apos;s local storage to remember
                  preferences (such as your unit choice) on your device only.
                </li>
                <li>
                  <strong>Standard technical data</strong> — like most websites, our hosting
                  provider and analytics/advertising partners may automatically receive
                  information such as your IP address, browser type, device, and pages visited,
                  used to operate, secure, and improve the Site.
                </li>
                <li>
                  <strong>Messages you send us</strong> — if you contact us by email, we receive
                  the information you choose to provide (such as your name and email) solely to
                  respond to you.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Cookies and advertising</h2>
              <p>
                The Site is supported by advertising. We and our third-party partners may use
                cookies and similar technologies to deliver and measure ads and to understand
                how the Site is used.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Google AdSense.</strong> We use Google, a third-party vendor, to serve
                  ads. Google uses cookies — including the DoubleClick DART cookie — to serve
                  ads based on your visits to this and other websites.
                </li>
                <li>
                  Third-party vendors and ad networks may also use cookies to serve ads based on
                  your prior visits. These cookies enable them and their partners to serve ads
                  relevant to your interests.
                </li>
                <li>
                  We may also use privacy-respecting analytics to understand aggregate, anonymous
                  traffic patterns.
                </li>
              </ul>
              <p>
                You can opt out of personalized advertising by visiting{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  Google Ads Settings
                </a>
                , and you can opt out of third-party vendor cookies via{" "}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  aboutads.info
                </a>
                . You can also block or delete cookies in your browser settings, though some
                features may not work as intended.
              </p>
              <p>
                For more on how Google uses information from sites that use its services, see{" "}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  Google&apos;s Privacy &amp; Terms
                </a>
                .
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">How information is used</h2>
              <p>
                Any data described above is used only to operate and secure the Site, serve and
                measure advertising, understand aggregate usage, and respond to messages you send
                us. We do not sell your personal information.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Your choices &amp; rights</h2>
              <p>
                Depending on your location, you may have rights to access, correct, or delete
                personal information, or to object to certain processing. Because we don&apos;t
                maintain accounts, the practical controls available to everyone are: managing
                cookies in your browser, using the advertising opt-outs above, and emailing us
                with any request. We&apos;ll respond in line with applicable law.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Children&apos;s privacy</h2>
              <p>
                The Site is intended for a general audience and is not directed to children
                under 13. We do not knowingly collect personal information from children.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Third-party links</h2>
              <p>
                The Site may link to external websites we don&apos;t control. Their privacy
                practices are governed by their own policies, and we encourage you to review
                them.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Changes to this policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we do, we&apos;ll
                revise the &ldquo;Last updated&rdquo; date above. Continued use of the Site after
                changes means you accept the revised policy.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Contact</h2>
              <p>
                Questions about this policy or your data? Email{" "}
                <a
                  href="mailto:shahzaibzafar093@gmail.com"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  shahzaibzafar093@gmail.com
                </a>{" "}
                or use our{" "}
                <Link
                  href="/contact"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  contact page
                </Link>
                .
              </p>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
