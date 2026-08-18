import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { KnowledgeBase } from "@/components/knowledge-base";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  page: fallback(z.string(), "").default(""),
  cats: fallback(z.array(z.string()), []).default([]),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Snoopy HQ Support Centre" },
      {
        name: "description",
        content:
          "Find Peanuts Store help for shopping, orders, shipping, returns, gifts, accounts, and customer support.",
      },
      { property: "og:title", content: "Snoopy HQ Support Centre" },
      {
        property: "og:description",
        content:
          "Find Peanuts Store help for shopping, orders, shipping, returns, gifts, accounts, and customer support.",
      },
    ],
  }),
  component: KnowledgeBase,
});
