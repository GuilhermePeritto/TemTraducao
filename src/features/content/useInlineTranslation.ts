import { useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_SETTINGS,
  type ExtensionSettings,
  getSettings,
  onSettingsChange,
  saveSettings,
} from "@/lib/storage";
import { fetchSynonyms, isSingleWordSelection } from "@/lib/translate";

import {
  createRangeSignature,
  extractSelectionBlocks,
  translateSelectionBlocks,
} from "./selection";
import { INITIAL_TOOLTIP_STATE, type AnchorRect, type TooltipState } from "./types";

function getAnchorRect(rect: DOMRect): AnchorRect {
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function useInlineTranslation(container: HTMLDivElement) {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [tooltipState, setTooltipState] = useState<TooltipState>(INITIAL_TOOLTIP_STATE);
  const currentHostname = useMemo(() => window.location.hostname.trim().toLowerCase(), []);
  const activeSelectionSignatureRef = useRef("");
  const dismissedSelectionSignatureRef = useRef("");
  const lastSeenSelectionSignatureRef = useRef("");

  useEffect(() => {
    getSettings().then(setSettings);
    return onSettingsChange(setSettings);
  }, []);

  useEffect(() => {
    activeSelectionSignatureRef.current = tooltipState.selectionSignature;
  }, [tooltipState.selectionSignature]);

  useEffect(() => {
    if (!settings.enabled || settings.disabledSites.includes(currentHostname)) {
      activeSelectionSignatureRef.current = "";
      setTooltipState(INITIAL_TOOLTIP_STATE);
      return;
    }

    let activeRequestId = 0;

    const closeTooltip = (dismissCurrentSelection = false) => {
      if (dismissCurrentSelection && activeSelectionSignatureRef.current) {
        dismissedSelectionSignatureRef.current = activeSelectionSignatureRef.current;
      }

      activeSelectionSignatureRef.current = "";
      setTooltipState(INITIAL_TOOLTIP_STATE);
    };

    const translateCurrentSelection = async () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim() ?? "";

      if (!selectedText || !selection || selection.rangeCount === 0) {
        lastSeenSelectionSignatureRef.current = "";
        dismissedSelectionSignatureRef.current = "";
        closeTooltip();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const selectionSignature = createRangeSignature(range, selectedText);

      if (!rect.width && !rect.height) {
        closeTooltip();
        return;
      }

      if (
        lastSeenSelectionSignatureRef.current &&
        lastSeenSelectionSignatureRef.current !== selectionSignature
      ) {
        dismissedSelectionSignatureRef.current = "";
      }

      lastSeenSelectionSignatureRef.current = selectionSignature;

      if (
        selectionSignature === dismissedSelectionSignatureRef.current ||
        selectionSignature === activeSelectionSignatureRef.current
      ) {
        return;
      }

      const selectedBlocks = extractSelectionBlocks(selection, selectedText);
      const requestId = ++activeRequestId;
      const nextState: TooltipState = {
        open: true,
        selectionSignature,
        selectedText,
        selectedBlocks,
        translatedText: "",
        translatedBlocks: [],
        detectedLanguage: undefined,
        isLoading: true,
        isLoadingSynonyms: false,
        synonyms: [],
        synonymsSource: undefined,
        error: undefined,
        anchorRect: getAnchorRect(rect),
      };

      activeSelectionSignatureRef.current = selectionSignature;
      setTooltipState(nextState);

      try {
        const result = await translateSelectionBlocks(selectedBlocks, settings.targetLanguage);

        if (requestId !== activeRequestId) {
          return;
        }

        setTooltipState({
          ...nextState,
          isLoading: false,
          translatedText: result.translatedText,
          translatedBlocks: result.translatedBlocks,
          detectedLanguage: result.detectedLanguage,
        });

        if (isSingleWordSelection(selectedText)) {
          setTooltipState((currentState) =>
            currentState.open
              ? {
                  ...currentState,
                  isLoadingSynonyms: true,
                }
              : currentState,
          );

          try {
            const synonymResult = await fetchSynonyms({
              selectedText,
              translatedText: result.translatedText,
              detectedLanguage: result.detectedLanguage,
              targetLanguage: settings.targetLanguage,
            });

            if (requestId !== activeRequestId) {
              return;
            }

            setTooltipState((currentState) => ({
              ...currentState,
              isLoadingSynonyms: false,
              synonyms: synonymResult?.synonyms ?? [],
              synonymsSource: synonymResult?.source,
            }));
          } catch {
            if (requestId !== activeRequestId) {
              return;
            }

            setTooltipState((currentState) => ({
              ...currentState,
              isLoadingSynonyms: false,
              synonyms: [],
              synonymsSource: undefined,
            }));
          }
        }
      } catch (error) {
        if (requestId !== activeRequestId) {
          return;
        }

        setTooltipState({
          ...nextState,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Não foi possível traduzir a seleção.",
        });
      }
    };

    const handleSelection = () => {
      void translateCurrentSelection();
    };

    const handleMouseDown = (event: MouseEvent) => {
      const eventPath = event.composedPath();

      if (eventPath.includes(container)) {
        return;
      }

      const selection = window.getSelection()?.toString().trim();
      if (!selection) {
        closeTooltip();
      }
    };

    const handleScroll = () => {
      closeTooltip();
    };

    const handleResize = () => {
      closeTooltip();
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);
    document.addEventListener("dblclick", handleSelection);
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
      document.removeEventListener("dblclick", handleSelection);
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [container, currentHostname, settings.disabledSites, settings.enabled, settings.targetLanguage]);

  async function disableInlineTranslation() {
    const nextSettings = { ...settings, enabled: false };
    setSettings(nextSettings);
    await saveSettings(nextSettings);
    activeSelectionSignatureRef.current = "";
    setTooltipState(INITIAL_TOOLTIP_STATE);
  }

  async function disableCurrentSite() {
    if (!currentHostname || settings.disabledSites.includes(currentHostname)) {
      return;
    }

    const nextSettings = {
      ...settings,
      disabledSites: [...settings.disabledSites, currentHostname],
    };

    setSettings(nextSettings);
    await saveSettings(nextSettings);
    activeSelectionSignatureRef.current = "";
    dismissedSelectionSignatureRef.current = "";
    lastSeenSelectionSignatureRef.current = "";
    setTooltipState(INITIAL_TOOLTIP_STATE);
  }

  function closeCurrentPopup() {
    dismissedSelectionSignatureRef.current = tooltipState.selectionSignature;
    activeSelectionSignatureRef.current = "";
    setTooltipState(INITIAL_TOOLTIP_STATE);
  }

  return {
    currentHostname,
    settings,
    tooltipState,
    closeCurrentPopup,
    disableInlineTranslation,
    disableCurrentSite,
  };
}
