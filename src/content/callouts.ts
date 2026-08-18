/**
 * Central registry of reusable inline callouts (notes & warnings) used in
 * knowledge base articles. Reference them from article content with a
 * token on its own line:
 *
 *     [note:back-up-first]
 *     [warn:suppertime-protest]
 *
 * Inline one-off callouts are still supported via the markdown syntax:
 *
 *     > [!NOTE] One-off note text.
 *     > [!WARNING] One-off warning text.
 */
import type { CalloutKind } from "@/components/kb-callout";

export interface CalloutRef {
  kind: CalloutKind;
  text: string;
}

export const callouts = {
  "back-up-first": {
    kind: "NOTE",
    text: "Back up your doghouse settings before making major changes — Snoopy hates surprises.",
  },
  "suppertime-protest": {
    kind: "WARNING",
    text: "Skipping or delaying suppertime triggers an immediate, dramatic protest dance.",
  },
  "lucy-football": {
    kind: "WARNING",
    text: "Never trust Lucy with the football. She will pull it away every single time.",
  },
  "woodstock-copilot": {
    kind: "NOTE",
    text: "Woodstock is the only authorised co-pilot for Flying Ace missions.",
  },
} as const satisfies Record<string, CalloutRef>;

export type CalloutKey = keyof typeof callouts;

export function getCallout(key: string): CalloutRef | undefined {
  return (callouts as Record<string, CalloutRef>)[key];
}
