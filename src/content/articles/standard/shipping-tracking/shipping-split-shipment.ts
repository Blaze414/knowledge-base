import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-split-shipment",
  categoryId: "shipping-tracking",
  title: "How to report missing items from a split shipment",
  steps: [
    "Check for separate tracking numbers because items may ship from different fulfilment centres and arrive over several days.",
    "If every package has been delivered and an item is still missing, contact Customer Service.",
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
  tags: ["split-shipment", "missing-item"],
});
