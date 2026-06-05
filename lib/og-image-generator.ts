/**
 * OG Image Generator Utility
 *
 * Recommended OG Images (1200x630px, under 1MB):
 * - /public/og-image.png   (Homepage)
 * - /public/og-default.png (Default for all pages)
 */

export const OG_IMAGE_CONFIG = {
  baseUrl: "https://freeconstructiontools.com",
  defaultImage: "/og-image.png",
  images: {
    home: "/og-image.png",
    tools: "/og-tools.png",
    default: "/og-default.png",
  },
  dimensions: {
    width: 1200,
    height: 630,
  },
};

/**
 * Get OG image URL for a specific page
 */
export function getOGImageUrl(page: "home" | "tools" | "default" = "default"): string {
  return `${OG_IMAGE_CONFIG.baseUrl}${OG_IMAGE_CONFIG.images[page] || OG_IMAGE_CONFIG.images.default}`;
}
