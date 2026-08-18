import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "shipping-po-box",
  categoryId: "shipping-tracking",
  title: "How to determine whether a product can ship to a PO box",
  steps: [
    "Use a PO box only when the checkout accepts it for the selected items and shipping method.",
    "Use a physical street address whenever possible, especially for a method other than Standard or Economy because some carriers cannot deliver to PO boxes.",
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
  tags: ["po-box", "shipping-restrictions"],
});
