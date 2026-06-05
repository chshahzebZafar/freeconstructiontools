import Link from "next/link";
import { HardHat } from "lucide-react";

const navLinks: Array<{ href: string; label: string }> = [
  { href: "/concrete-calculator", label: "Concrete" },
  { href: "/roofing-calculator", label: "Roofing" },
  { href: "/flooring-calculator", label: "Flooring" },
  { href: "/#calculators", label: "All calculators" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 bg-zinc-950 dark:bg-white rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
              <HardHat className="w-4 h-4 text-white dark:text-zinc-950" />
            </div>
            <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Free Construction Tools
            </span>
          </Link>

          {/* Nav — horizontal scroll on small screens, no JS needed */}
          <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
