import { defineStandardArticle } from "../../define-article";

export default defineStandardArticle({
  id: "gifts-message",
  categoryId: "gifts-bulk",
  title: "How to include a gift message",
  steps: [
    "Do not look for a gift-message field at checkout.",
    "The Store's Gift Wrapping and Messaging help page states that gift messages cannot be included with orders at this time.",
  ],
  sources: [
    {
      label: "Gift help",
      url: "https://help.peanutsstoresupport.com/hc/en-us/sections/16263556808084-Gift-Wrapping-and-Messaging",
    },
  ],
  tags: ["gift", "message"],
});
