import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-delivered-not-received",
  categoryId: "shipping-tracking",
  title: "How to handle an order marked delivered but not received",
  steps: [
    "Contact the shipping carrier directly with the tracking number and ask it to confirm the delivery status.",
    "Check secure locations such as a mailroom, porch, or neighbour. If the carrier cannot locate the package, contact Customer Service.",
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
  tags: ["delivered", "missing-parcel", "tracking"],
});
