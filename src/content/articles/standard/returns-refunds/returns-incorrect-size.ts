import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "returns-incorrect-size",
  categoryId: "returns-refunds",
  title: "How to deal with an incorrect size when exchanges are unavailable",
  steps: [
    "Check that the item is return-eligible and remains unused, unworn, and unwashed.",
    "Return the unsuitable size for a refund and place a separate order for the required size while it is available.",
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
  tags: ["size", "exchange", "return"],
});
