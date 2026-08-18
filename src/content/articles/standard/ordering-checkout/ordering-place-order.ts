import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-place-order",
  categoryId: "ordering-checkout",
  title: "How to place an order on the Peanuts Store",
  steps: [
    "Choose the required product options, add the item to your cart, and review the cart contents and quantities.",
    "Proceed to checkout, enter delivery and payment details, review the final total, and place the order once everything is correct.",
  ],
  note: "Keep the order-confirmation email and order number for tracking or support.",
  sources: [
    {
      label: "Ordering policy",
      url: "https://peanuts.store/pages/ordering-policy",
    },
  ],
  tags: ["order", "checkout"],
});
