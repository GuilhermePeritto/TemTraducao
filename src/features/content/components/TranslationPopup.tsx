import { Check, Copy, Languages, Sparkles, X } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { getLanguageLabel, LANGUAGE_OPTIONS, type ExtensionSettings } from "@/lib/storage";

import { clamp, getCompactBlockStyle } from "../selection";
import type { TooltipPlacement, TooltipState } from "../types";

function TranslationSkeleton({ state }: { state: TooltipState }) {
  const previewBlocks =
    state.selectedBlocks.length > 0
      ? state.selectedBlocks
      : [
          {
            id: "skeleton-block",
            text: "",
            level: "body" as const,
            style: {
              fontSize: 16,
              fontWeight: 500,
              fontStyle: "normal",
              textTransform: "none",
              letterSpacing: 0,
              lineHeight: 24,
              textAlign: "left" as const,
            },
          },
        ];

  return (
    <div className="space-y-3">
      {previewBlocks.map((block, index) => {
        const compactStyle = getCompactBlockStyle(block.style, block.level);
        const baseHeight = Number.parseFloat(compactStyle.lineHeight) || 24;
        const widths =
          block.level === "display"
            ? ["72%", "44%"]
            : block.level === "heading"
              ? ["88%", "58%"]
              : ["100%", "92%", "68%"];

        return (
          <div key={`${block.id}-${index}`} className="space-y-2">
            {widths.map((width) => (
              <div
                key={width}
                className="glass-skeleton rounded-lg"
                style={{ height: `${baseHeight}px`, width }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function TranslationPopup({
  state,
  targetLanguage,
  currentHostname,
  onClose,
  onDisable,
  onDisableSite,
}: {
  state: TooltipState;
  targetLanguage: ExtensionSettings["targetLanguage"];
  currentHostname: string;
  onClose: () => void;
  onDisable: () => void;
  onDisableSite: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    placement: TooltipPlacement;
  }>({
    left: 0,
    top: 0,
    placement: "bottom",
  });

  const targetLanguageLabel = useMemo(
    () =>
      LANGUAGE_OPTIONS.find((language) => language.value === targetLanguage)?.label ??
      targetLanguage,
    [targetLanguage],
  );
  const sourceLanguageLabel = getLanguageLabel(state.detectedLanguage);
  const showSynonyms = state.isLoadingSynonyms || state.synonyms.length > 0;
  const synonymsTitle =
    state.synonymsSource === "translated"
      ? "Sinônimos da tradução"
      : "Sinônimos da seleção";

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  useEffect(() => {
    setCopied(false);
  }, [state.translatedText]);

  useEffect(() => {
    if (!state.open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key.toLowerCase() === "d") {
        event.preventDefault();
        onDisable();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [state.open, onClose, onDisable]);

  useLayoutEffect(() => {
    if (!state.open || !cardRef.current) {
      return;
    }

    const spacing = 14;
    const viewportPadding = 12;
    const tooltipRect = cardRef.current.getBoundingClientRect();
    const { anchorRect } = state;

    const centeredLeft =
      anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
    let left = clamp(
      centeredLeft,
      viewportPadding,
      window.innerWidth - tooltipRect.width - viewportPadding,
    );
    let top = anchorRect.bottom + spacing;
    let placement: TooltipPlacement = "bottom";

    if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
      const topCandidate = anchorRect.top - tooltipRect.height - spacing;

      if (topCandidate >= viewportPadding) {
        top = topCandidate;
        placement = "top";
      } else {
        const rightCandidate = anchorRect.right + spacing;
        if (rightCandidate + tooltipRect.width <= window.innerWidth - viewportPadding) {
          left = rightCandidate;
          top = clamp(
            anchorRect.top - 6,
            viewportPadding,
            window.innerHeight - tooltipRect.height - viewportPadding,
          );
          placement = "right";
        } else {
          const leftCandidate = anchorRect.left - tooltipRect.width - spacing;

          if (leftCandidate >= viewportPadding) {
            left = leftCandidate;
            top = clamp(
              anchorRect.top - 6,
              viewportPadding,
              window.innerHeight - tooltipRect.height - viewportPadding,
            );
            placement = "left";
          } else {
            top = clamp(
              top,
              viewportPadding,
              window.innerHeight - tooltipRect.height - viewportPadding,
            );
          }
        }
      }
    }

    setPosition({ left, top, placement });
  }, [
    state.open,
    state.anchorRect,
    state.isLoading,
    state.synonyms.length,
    state.error,
    state.translatedText,
    state.translatedBlocks.length,
  ]);

  if (!state.open) {
    return null;
  }

  const handleCopy = async () => {
    if (!state.translatedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(state.translatedText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="traduzir-selecao-reset"
      style={{
        position: "fixed",
        left: `${position.left}px`,
        top: `${position.top}px`,
        zIndex: 2147483647,
      }}
    >
      <div
        ref={cardRef}
        className={cn(
          "relative w-[316px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,12,16,0.97),rgba(12,15,20,0.95))] text-white shadow-[0_26px_80px_rgba(0,0,0,0.52)] backdrop-blur-2xl",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(87,132,255,0.18),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Sparkles className="h-4 w-4 text-blue-300" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[-0.02em] text-white/80">
                {sourceLanguageLabel} -&gt; {targetLanguageLabel}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-white/45">
                Tradução rápida da seleção
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Fechar popup de tradução"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative border-t border-white/10 px-4 py-4">
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/42">
              Original
            </p>
            <p className="text-[14px] leading-6 text-white/86">{state.selectedText}</p>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(67,107,255,0.16),rgba(67,107,255,0.06))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100/60">
                <Languages className="h-3.5 w-3.5" />
                Tradução
              </p>

              {!state.isLoading && !state.error ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleCopy();
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/62 transition hover:bg-white/10 hover:text-white"
                  aria-label="Copiar tradução"
                  title="Copiar tradução"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              ) : null}
            </div>

            {state.isLoading ? (
              <TranslationSkeleton state={state} />
            ) : state.error ? (
              <p className="text-sm leading-6 text-red-200">{state.error}</p>
            ) : (
              <div className="space-y-3">
                {state.translatedBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={cn(
                      "text-blue-200",
                      block.level === "display" && "font-semibold tracking-[-0.03em] text-blue-300",
                      block.level === "heading" && "font-semibold tracking-[-0.02em] text-blue-200",
                      block.level === "body" && "font-medium text-blue-100",
                    )}
                    style={getCompactBlockStyle(block.style, block.level)}
                  >
                    {block.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showSynonyms && !state.error ? (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/42">
                {synonymsTitle}
              </div>
              {state.isLoadingSynonyms ? (
                <div className="flex flex-wrap gap-2">
                  <div className="glass-skeleton h-8 w-20 rounded-full" />
                  <div className="glass-skeleton h-8 w-24 rounded-full" />
                  <div className="glass-skeleton h-8 w-16 rounded-full" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {state.synonyms.map((synonym) => (
                    <span
                      key={synonym}
                      className="rounded-full border border-emerald-300/18 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100/85"
                    >
                      {synonym}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onDisable}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-white/62 transition hover:bg-white/10 hover:text-white"
              title="Atalho: D"
            >
              Desativar inline
            </button>
            <span className="truncate text-[11px] text-white/38">{currentHostname}</span>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-black/10 px-4 py-3">
          <button
            type="button"
            onClick={onDisableSite}
            className="w-full rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-[12px] font-medium text-white/72 transition hover:bg-white/[0.08] hover:text-white"
          >
            Não traduzir novamente neste site
          </button>
        </div>
      </div>
    </div>
  );
}
