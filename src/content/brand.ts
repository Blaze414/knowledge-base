import siteLogoSrc from "@/assets/brand/snoopy-woodstock-logo.webp";
import pageOutlineIconSrc from "@/assets/brand/right-sidebar-bird.svg";

export interface BrandAsset {
  src: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Central branding configuration.
 *
 * Replace an imported file or update its metadata here to change the visual
 * everywhere it appears. Layout-specific display sizes stay with each UI
 * component so a single asset can remain responsive in every placement.
 */
export const siteBrand = {
  name: "Snoopy HQ",
  productName: "Docs Companion",
  homeLabel: "Go to Snoopy HQ home",
  navigation: {
    title: "Documentation",
    description: "Browse support topics",
  },
  assets: {
    logo: {
      src: siteLogoSrc,
      width: 254,
      height: 320,
      alt: "Snoopy and Woodstock",
    },
    pageOutlineIcon: {
      src: pageOutlineIconSrc,
      width: 193,
      height: 193,
      alt: "Woodstock",
    },
    favicon: {
      href: "/favicon.png",
      type: "image/png",
    },
  },
  pageOutline: {
    label: "Page outline",
    showLabel: "Show page outline",
    hideLabel: "Hide page outline",
  },
} as const;
