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

  return [homepage, ...toolPages];
}
