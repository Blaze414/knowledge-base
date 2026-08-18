import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-tracking-not-updated",
  categoryId: "shipping-tracking",
  title: "How to troubleshoot tracking that has not updated",
  steps: [
    "Allow 3-4 business days after shipment for tracking information to update.",
    "Treat pre-shipment or preparing to ship as confirmation that a label exists but the carrier has not yet scanned the package.",
  ],
  sources: [
    {
      label: "Shipping policy",
      url: "https://peanuts.store/pages/shipping-policy",
    },
    {
      label: "Shipping and tracking help",
      url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263579199892-Shipping-Order-Tracking-and-Delivery-information",
    },
  ],
  tags: ["tracking", "delay", "troubleshooting"],
});
