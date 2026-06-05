import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Free Construction Tools — Calculators & Estimators",
    short_name: "Construction Tools",
    description:
      "Free construction calculators and estimators for concrete, lumber, roofing, flooring, paint, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#09090b",
    icons: [
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
