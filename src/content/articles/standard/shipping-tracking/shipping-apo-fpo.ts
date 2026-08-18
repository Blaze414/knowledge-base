import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-apo-fpo",
  categoryId: "shipping-tracking",
  title: "How to ship to an APO/FPO military address",
  steps: [
    "Enter the service member's name, unit and box details, and select APO or FPO with the appropriate AE, AP, or AA region.",
    "Use United States as the country and allow the longer military-mail delivery window shown in the shipping policy.",
  ],
  note: "Military-address delivery may take two to four weeks after dispatch.",
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
  tags: ["apo", "fpo", "military"],
});
