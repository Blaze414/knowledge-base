import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "returns-shipping-deductions",
  categoryId: "returns-refunds",
  title: "How to understand return-shipping deductions",
  steps: [
    "Expect an approved refund to cover the returned product price only.",
    "Original shipping charges are not refunded, and the Return Policy says the refund is issued minus applicable shipping charges or return fees.",
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
  tags: ["return", "shipping-cost", "refund"],
});
