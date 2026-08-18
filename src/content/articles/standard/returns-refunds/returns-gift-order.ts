import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "returns-gift-order",
  categoryId: "returns-refunds",
  title: "How to return an order received as a gift",
  steps: [
    "Confirm that the gift is unused and still within the return window required by the Return Policy.",
    "Contact Customer Service to begin the return. Any approved refund is issued to the original purchaser.",
  ],
  sources: [
    {
      label: "Return policy",
      url: "https://peanuts.store/pages/return-policy",
    },
    {
      label: "Returns and exchanges help",
      url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263552225812-Returns-and-Exchanges",
    },
  ],
  tags: ["gift", "return"],
});
