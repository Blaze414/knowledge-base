import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-multiple-addresses",
  categoryId: "shipping-tracking",
  title: "How to send products to multiple addresses",
  steps: [
    "Create a separate order for each delivery address because one order cannot be split across multiple destinations.",
    "Review the recipient and address at each checkout before placing the next order.",
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
  tags: ["multiple-addresses", "gifts"],
});
