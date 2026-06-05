"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    let currentPath = "";
    paths.forEach((path) => {
      currentPath += `/${path}`;
      const label = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `https://freeconstructiontools.com${crumb.href}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <nav
        className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500 px-4 sm:px-6 lg:px-8 pt-4 pb-1"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-1.5 flex-wrap">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {index === 0 ? (
                  <Link
                    href={crumb.href}
                    className="flex items-center gap-1 hover:text-zinc-950 dark:hover:text-white transition-colors"
                    aria-label="Home"
                  >
                    <Home className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <>
                    <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
                    {isLast ? (
                      <span
                        className="text-zinc-950 dark:text-white font-medium"
                        aria-current="page"
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="hover:text-zinc-950 dark:hover:text-white transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
