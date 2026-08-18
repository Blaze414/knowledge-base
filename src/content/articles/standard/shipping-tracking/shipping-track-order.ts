import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-track-order",
  categoryId: "shipping-tracking",
  title: "How to track a Peanuts Store shipment",
  steps: [
    "Open the shipping-confirmation email and select the tracking link for the dispatched parcel.",
    "If the order was split, check each tracking number separately because items may arrive on different days.",
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
  tags: ["tracking", "shipment"],
});
