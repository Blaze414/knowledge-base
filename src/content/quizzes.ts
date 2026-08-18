/** Interactive quiz definitions embedded with `[quiz:key]` article tokens. */
export interface QuizOption {
  label: string;
  correct?: boolean;
}

export interface QuizQuestion {
  label: string;
  prompt: string;
  image?: string;
  alt?: string;
  options: QuizOption[];
  explanation: string;
}

export interface Quiz {
  title?: string;
  intro?: string;
  questions: QuizQuestion[];
}

// The previous demo quiz referenced retired fictional articles. Keep the
// registry ready for future customer-facing quizzes without shipping stale
// content or loading unused media assets.
export const quizzes = {} satisfies Record<string, Quiz>;

export type QuizKey = keyof typeof quizzes;

export function getQuiz(key: string): Quiz | undefined {
  return (quizzes as Record<string, Quiz>)[key];
}
