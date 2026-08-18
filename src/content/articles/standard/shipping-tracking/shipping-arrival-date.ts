import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-arrival-date",
  categoryId: "shipping-tracking",
  title: "How to calculate the likely arrival date for an order",
  steps: [
    "Start with the product's processing period; the store states that processing commonly takes 4-10 business days before shipping.",
    "Add the published shipping estimate: Standard 5-8 business days, Expedited 3-5 business days, or Priority 2-3 business days after processing when that method is available.",
  ],
  note: "Carrier estimates begin after dispatch and are not guaranteed delivery dates.",
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
  tags: ["arrival", "processing", "delivery"],
});
