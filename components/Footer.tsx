import Link from "next/link";
import { HardHat, Github, Twitter, Linkedin, Globe, Mail } from "lucide-react";
import { categoryTools } from "@/lib/category-tools";

const socialLinks = [
  { href: "https://github.com/chshahzebZafar/", icon: Github, label: "GitHub" },
  { href: "https://x.com/SHAHZEBZAFAR99", icon: Twitter, label: "Twitter" },
  { href: "https://www.linkedin.com/in/shahzaib-zafer/", icon: Linkedin, label: "LinkedIn" },
  { href: "https://shahzebzafar.netlify.app/", icon: Globe, label: "Website" },
  { href: "mailto:shahzaibzafar093@gmail.com", icon: Mail, label: "Email" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Split the calculators into two columns for the footer grid.
  const mid = Math.ceil(categoryTools.length / 2);
  const columns = [categoryTools.slice(0, mid), categoryTools.slice(mid)];

  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 bg-zinc-950 dark:bg-white rounded-md flex items-center justify-center">
                <HardHat className="w-3.5 h-3.5 text-white dark:text-zinc-950" />
              </div>
              <span className="text-[15px] font-semibold text-zinc-950 dark:text-white tracking-tight">
                Free Construction Tools
              </span>
            </Link>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">
              Free, browser-based construction calculators and estimators for contractors,
              builders, and DIYers. No signup, no upsell, no tracking.
            </p>
          </div>

          {/* Calculator columns */}
          {columns.map((col, i) => (
            <div key={i}>
              <h3 className="text-xs font-semibold text-zinc-950 dark:text-white uppercase tracking-wider mb-5">
                {i === 0 ? "Calculators" : "More calculators"}
              </h3>
              <ul className="space-y-3">
                {col.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={tool.path}
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                    >
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            © {currentYear} Free Construction Tools. Built by{" "}
            <a
              href="https://shahzebzafar.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              Shahzeb Zafar
            </a>
            . Estimates only — always confirm with a local quote and your building code.
          </p>
          <div className="flex items-center gap-1">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                aria-label={s.label}
                className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
