import type { Metadata } from "next";
import { Mail, MessageSquare, Globe } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Free Construction Tools",
  description:
    "Get in touch with Free Construction Tools. Suggest a calculator, report an issue, or ask a question. We read every message.",
  alternates: { canonical: "https://freeconstructiontools.com/contact" },
  openGraph: {
    title: "Contact — Free Construction Tools",
    description:
      "Suggest a calculator, report an issue, or ask a question. We read every message.",
    url: "https://freeconstructiontools.com/contact",
    siteName: "Free Construction Tools",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1">
        <Breadcrumbs />
        <section className="border-b border-zinc-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <Badge variant="neutral" className="mb-4">
              <MessageSquare className="w-3 h-3" />
              Contact
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-950 tracking-tight mb-5">
              Get in touch
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed">
              Questions, a calculator you wish we had, or a result that looks off? Tell us — your
              feedback is how these tools get better. We read every message.
            </p>
          </div>
        </section>

        <section>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
              {/* Form */}
              <div className="lg:col-span-3">
                <h2 className="text-xl font-semibold text-zinc-950 mb-5">Send a message</h2>
                <ContactForm />
              </div>

              {/* Direct */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold text-zinc-950 mb-5">Reach us directly</h2>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="mailto:shahzaibzafar093@gmail.com"
                      className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-md bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-zinc-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-950">Email</p>
                        <p className="text-sm text-zinc-600 break-all">
                          shahzaibzafar093@gmail.com
                        </p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://shahzebzafar.netlify.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 rounded-lg p-4 hover:border-zinc-300 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-md bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-zinc-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-950">Website</p>
                        <p className="text-sm text-zinc-600">shahzebzafar.netlify.app</p>
                      </div>
                    </a>
                  </li>
                </ul>
                <p className="text-sm text-zinc-500 mt-5 leading-relaxed">
                  We typically reply within a few business days. There&apos;s no account to
                  create and we won&apos;t add you to any mailing list.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
