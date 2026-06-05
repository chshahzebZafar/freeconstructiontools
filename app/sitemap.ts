import { MetadataRoute } from "next";
import { categoryTools } from "@/lib/category-tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://freeconstructiontools.com";
  const CONTENT_REFRESHED = new Date("2026-06-05");

  const homepage: MetadataRoute.Sitemap[0] = {
    url: baseUrl,
    lastModified: CONTENT_REFRESHED,
    changeFrequency: "weekly",
    priority: 1.0,
  };

  const toolPages: MetadataRoute.Sitemap = categoryTools.map((tool) => ({
    url: `${baseUrl}${tool.path}`,
    lastModified: CONTENT_REFRESHED,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const contentPages: MetadataRoute.Sitemap = [
    { path: "/about", priority: 0.6 },
    { path: "/contact", priority: 0.6 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ].map((p) => ({
    url: `${baseUrl}${p.path}`,
    lastModified: CONTENT_REFRESHED,
    changeFrequency: "yearly" as const,
    priority: p.priority,
  }));

  return [homepage, ...toolPages, ...contentPages];
}
