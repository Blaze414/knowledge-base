import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-duties",
  categoryId: "shipping-tracking",
  title: "How to understand international duties and import fees",
  steps: [
    "Check the checkout total for import fees, taxes, or duties charged before dispatch.",
    "Allow for additional fees that may be collected on delivery. The Shipping Policy states that the customer is responsible for these charges.",
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
  tags: ["international", "duties", "fees"],
});
