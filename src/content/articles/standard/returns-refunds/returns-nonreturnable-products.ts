import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "returns-nonreturnable-products",
  categoryId: "returns-refunds",
  title: "How to identify products that cannot be returned",
  steps: [
    "Check the product page and return policy for final-sale or product-specific exclusions.",
    "Treat personalised products, gift cards, standees, charity items, and items marked final sale or exclusive as ineligible for a standard return.",
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
  tags: ["return", "final-sale", "eligibility"],
});
