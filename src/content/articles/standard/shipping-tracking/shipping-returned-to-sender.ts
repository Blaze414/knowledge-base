import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-returned-to-sender",
  categoryId: "shipping-tracking",
  title: "How to handle an order being returned to sender",
  steps: [
    "Confirm that tracking shows the package is being returned to sender.",
    "Contact Customer Service as soon as possible so the team can review the order and shipping details without waiting for the package to reach the warehouse.",
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
  tags: ["returned-to-sender", "address", "support"],
});
