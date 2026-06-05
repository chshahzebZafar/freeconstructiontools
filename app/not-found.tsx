import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { categoryTools } from "@/lib/category-tools";

export const metadata = {
  title: "404 — Page Not Found | Free Construction Tools",
  description:
    "The page you're looking for doesn't exist. Browse our free construction calculators instead.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const popular = categoryTools.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
            Error 404
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-950 dark:text-white mb-4">
            This page took a wrong turn
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            We couldn&apos;t find what you were looking for — the link may have moved or the
            URL has a typo. All our free construction calculators are still here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-md text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mt-16">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
              Or try one of these
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {popular.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.slug}
                    href={tool.path}
                    className="group flex flex-col items-start gap-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <p className="text-sm font-semibold leading-snug text-zinc-900 dark:text-white text-left">
                      {tool.name}
                    </p>
                    <ArrowRight className="ml-auto mt-auto h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
