import Link from "next/link";
import { getCategoryToolsBy } from "@/lib/category-tools";

interface RelatedCategoryToolsProps {
  category: string;
  currentSlug: string;
}

export default function RelatedCategoryTools({ category, currentSlug }: RelatedCategoryToolsProps) {
  const tools = getCategoryToolsBy(category).filter((t) => t.slug !== currentSlug);
  if (tools.length === 0) return null;

  return (
    <section className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-5">
          Related tools
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.slug}
                href={tool.path}
                className="group flex items-start gap-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                  <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    {tool.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                    {tool.tagline}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
