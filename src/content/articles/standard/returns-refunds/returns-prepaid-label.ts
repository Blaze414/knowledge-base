import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "returns-prepaid-label",
  categoryId: "returns-refunds",
  title: "How to return an order using the prepaid label",
  steps: [
    "Open the Store's returns centre and start the return for an eligible item.",
    "Use the prepaid return label provided for eligible US returns. Do not use your own shipping label.",
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
  tags: ["return-label", "tracking"],
});
