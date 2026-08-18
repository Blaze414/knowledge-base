import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "accounts-create-account",
  categoryId: "accounts-support",
  title: "How to create a Peanuts Store account",
  steps: [
    "Open the Store account page and use the account-creation control displayed there, if available.",
    "Enter only the information requested on the live form. The official source pages reviewed do not document a separate account-creation procedure.",
  ],
  sources: [
    {
      label: "Store account",
      url: "https://peanuts.store/account/login",
    },
  ],
  tags: ["account", "sign-up"],
});
