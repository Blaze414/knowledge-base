import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "accounts-sign-in-reset-password",
  categoryId: "accounts-support",
  title: "How to sign in and reset a forgotten password",
  steps: [
    "Open the Store account page and use the sign-in fields displayed there.",
    "If a password-reset control is shown, follow its on-screen instructions. The official source pages reviewed do not publish additional reset steps.",
  ],
  sources: [
    {
      label: "Store account",
      url: "https://peanuts.store/account/login",
    },
  ],
  tags: ["account", "password", "sign-in"],
});
