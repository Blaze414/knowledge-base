/**
 * Central registry of guided "choose your own adventure" questionnaires.
 *
 * Embed one from any article with a token on its own line:
 *
 *     [chooser:lesson-plans]
 *
 * Each chooser is a small decision tree. Every step asks a single
 * question with 2–4 options. Each option's `next` is either another
 * step id or `article:<pageId>` to deliver a final recommendation.
 */
export interface ChooserOption {
  label: string;
  /** Either a step id in this chooser, or `article:<pageId>`. */
  next: string;
  /** Optional one-line "why this fits" shown on the result card. */
  why?: string;
}

export interface ChooserStep {
  id: string;
  question: string;
  options: ChooserOption[];
}

export interface Chooser {
  /** Optional title shown above the chooser frame. */
  title?: string;
  intro?: string;
  /** Id of the first step. */
  start: string;
  steps: ChooserStep[];
}

// No active chooser is currently embedded in the customer-facing catalogue.
// New guided flows can be registered here when an article needs one.
export const choosers = {} satisfies Record<string, Chooser>;

export type ChooserKey = keyof typeof choosers;

export function getChooser(key: string): Chooser | undefined {
  return (choosers as Record<string, Chooser>)[key];
}
