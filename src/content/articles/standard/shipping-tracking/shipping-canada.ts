import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-canada",
  categoryId: "shipping-tracking",
  title: "How to ship an order to Canada",
  steps: [
    "Check the product page because only selected items are eligible for delivery to Canada.",
    "Enter the complete Canadian address at checkout and review the GST/HST, shipping estimate, and any customs duties that may apply.",
  ],
  note: "International orders do not qualify for free-shipping promotions, and customs clearance may add time.",
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
  tags: ["canada", "international"],
});
