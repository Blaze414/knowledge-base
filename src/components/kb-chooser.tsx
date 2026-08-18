import React, { useMemo, useState } from "react";
import { ChevronRight, RotateCcw, ArrowLeft, Compass } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cardVariants } from "@/components/ui/card";
import type { Chooser, ChooserStep, ChooserOption } from "@/content/choosers";
import { pageContents } from "@/content/articles";

function resolveResult(
  next: string,
): { kind: "step"; id: string } | { kind: "article"; id: string } {
  if (next.startsWith("article:")) return { kind: "article", id: next.slice("article:".length) };
  return { kind: "step", id: next };
}

interface Props {
  chooser: Chooser;
  scopeId: string;
}

export const KbChooser: React.FC<Props> = ({ chooser, scopeId }) => {
  const stepMap = useMemo(
    () => new Map<string, ChooserStep>(chooser.steps.map((s) => [s.id, s])),
    [chooser],
  );
  // Stack of step ids the user has visited (excluding result), so Back is
  // multi-step aware.
  const [stack, setStack] = useState<string[]>([chooser.start]);
  const [result, setResult] = useState<{ pageId: string; why?: string } | null>(null);

  const currentStepId = stack[stack.length - 1];
  const currentStep = stepMap.get(currentStepId);

  const choose = (opt: ChooserOption) => {
    const r = resolveResult(opt.next);
    if (r.kind === "article") {
      setResult({ pageId: r.id, why: opt.why });
    } else if (stepMap.has(r.id)) {
      setStack((s) => [...s, r.id]);
    }
  };

  const back = () => {
    if (result) {
      setResult(null);
      return;
    }
    if (stack.length > 1) setStack((s) => s.slice(0, -1));
  };

  const restart = () => {
    setStack([chooser.start]);
    setResult(null);
  };

  const progress = result
    ? 100
    : Math.min(
        100,
        Math.round(((stack.length - 1) / Math.max(1, chooser.steps.length)) * 100) + 25,
      );

  const resultPage = result ? pageContents[result.pageId] : null;

  return (
    <section
      aria-label={chooser.title ?? "Guided chooser"}
      className={cardVariants({ variant: "muted", className: "my-8 overflow-hidden" })}
    >
      <header className="flex items-center gap-2 border-b border-brand-hairline bg-card/80 px-5 py-3">
        <Compass className="h-4 w-4 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          {chooser.title && <h3 className="h5 truncate text-foreground">{chooser.title}</h3>}
          {chooser.intro && <p className="small mt-0.5 text-muted-foreground">{chooser.intro}</p>}
        </div>
      </header>

      <div
        className="h-1 w-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="px-5 py-6" aria-live="polite">
        {result && resultPage ? (
          <div>
            <p className="h6 text-muted-foreground">Recommended</p>
            <h4 className="h3 mt-1 text-foreground">{resultPage.title}</h4>
            {result.why && <p className="body mt-2 text-muted-foreground">{result.why}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <Link
                  to="/"
                  search={(prev: Record<string, unknown>) => ({
                    ...prev,
                    page: result.pageId,
                  })}
                >
                  Open guide
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={back}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button size="sm" variant="ghost" onClick={restart}>
                <RotateCcw className="h-4 w-4" /> Start over
              </Button>
            </div>
          </div>
        ) : currentStep ? (
          <div>
            <p className="h6 text-muted-foreground">Step {stack.length}</p>
            <h4 className="h4 mt-1 text-foreground">{currentStep.question}</h4>
            <div role="radiogroup" aria-label={currentStep.question} className="mt-4 grid gap-2">
              {currentStep.options.map((opt, i) => (
                <button
                  key={`${scopeId}-${currentStep.id}-${i}`}
                  type="button"
                  role="radio"
                  aria-checked={false}
                  onClick={() => choose(opt)}
                  className="body group flex items-center justify-between gap-3 rounded-lg border border-brand-hairline bg-background px-4 py-3 text-left text-foreground transition-colors hover:border-primary/60 hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <span>{opt.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
            {(stack.length > 1 || result) && (
              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={back}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button size="sm" variant="ghost" onClick={restart}>
                  <RotateCcw className="h-4 w-4" /> Start over
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="body text-destructive">
            Chooser misconfigured: step "{currentStepId}" not found.
          </p>
        )}
      </div>
    </section>
  );
};
