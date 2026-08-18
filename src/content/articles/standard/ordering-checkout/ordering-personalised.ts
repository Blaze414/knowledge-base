import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "ordering-personalised",
  categoryId: "ordering-checkout",
  title: "How to order personalized Peanuts merchandise",
  steps: [
    "Open a product listed in the Personalized and Customized collection and enter the options requested on that product page.",
    "Review the entered personalisation before adding the product to the cart.",
  ],
  note: "The Return Policy lists personalised products among the products that cannot be returned.",
  sources: [
    {
      label: "Personalized and Customized products",
      url: "https://peanuts.store/collections/personalized-and-customized",
    },
    {
      label: "Return policy",
      url: "https://peanuts.store/pages/return-policy",
    },
  ],
  tags: ["personalised", "custom", "final-sale"],
});
