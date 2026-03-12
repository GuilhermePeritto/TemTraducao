import { translateText } from "@/lib/translate";
import type { ExtensionSettings } from "@/lib/storage";

import type {
  SelectionBlock,
  SelectionBlockLevel,
  SelectionBlockStyle,
} from "./types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeBlockText(text: string) {
  return text
    .replace(/\s*\n+\s*/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

function getNodePath(node: Node) {
  const path: number[] = [];
  let current: Node | null = node;

  while (current?.parentNode) {
    path.unshift(Array.prototype.indexOf.call(current.parentNode.childNodes, current));
    current = current.parentNode;
  }

  return path.join(".");
}

export function createRangeSignature(range: Range, selectedText: string) {
  return [
    selectedText.trim(),
    getNodePath(range.startContainer),
    range.startOffset,
    getNodePath(range.endContainer),
    range.endOffset,
  ].join("::");
}

function getSelectedPortionFromTextNode(node: Text, range: Range) {
  const text = node.textContent ?? "";

  if (!text) {
    return "";
  }

  let start = 0;
  let end = text.length;

  if (node === range.startContainer) {
    start = range.startOffset;
  }

  if (node === range.endContainer) {
    end = range.endOffset;
  }

  return text.slice(start, end);
}

function getBlockContainer(element: HTMLElement | null) {
  let current = element;

  while (current && current !== document.body) {
    const computedStyle = window.getComputedStyle(current);
    const tagName = current.tagName.toLowerCase();
    const isHeading = /^h[1-6]$/.test(tagName);
    const isBlockDisplay = [
      "block",
      "flex",
      "grid",
      "list-item",
      "table",
      "table-row",
    ].includes(computedStyle.display);

    if (isHeading || isBlockDisplay) {
      return current;
    }

    current = current.parentElement;
  }

  return element;
}

function getBlockLevel(
  element: HTMLElement,
  style: SelectionBlockStyle,
): SelectionBlockLevel {
  const tagName = element.tagName.toLowerCase();

  if (/^h[1-2]$/.test(tagName) || style.fontSize >= 30) {
    return "display";
  }

  if (/^h[3-6]$/.test(tagName) || style.fontSize >= 21 || style.fontWeight >= 600) {
    return "heading";
  }

  return "body";
}

function getBlockStyle(element: HTMLElement): SelectionBlockStyle {
  const computedStyle = window.getComputedStyle(element);
  const fontSize = Number.parseFloat(computedStyle.fontSize) || 16;
  const fontWeight = Number.parseInt(computedStyle.fontWeight, 10) || 400;
  const letterSpacing = Number.parseFloat(computedStyle.letterSpacing);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight);
  const textAlign = ["center", "right", "left"].includes(computedStyle.textAlign)
    ? (computedStyle.textAlign as SelectionBlockStyle["textAlign"])
    : "left";

  return {
    fontSize,
    fontWeight,
    fontStyle: computedStyle.fontStyle,
    textTransform: computedStyle.textTransform,
    letterSpacing: Number.isFinite(letterSpacing) ? letterSpacing : 0,
    lineHeight: Number.isFinite(lineHeight) ? lineHeight : fontSize * 1.45,
    textAlign,
  };
}

function getFallbackSelectionBlock(selectedText: string, range: Range): SelectionBlock {
  const element =
    range.startContainer instanceof HTMLElement
      ? range.startContainer
      : range.startContainer.parentElement;
  const blockElement = getBlockContainer(element) ?? document.body;
  const style = getBlockStyle(blockElement);

  return {
    id: "block-0",
    text: normalizeBlockText(selectedText),
    level: getBlockLevel(blockElement, style),
    style,
  };
}

export function extractSelectionBlocks(
  selection: Selection,
  selectedText: string,
): SelectionBlock[] {
  if (selection.rangeCount === 0) {
    return [];
  }

  const range = selection.getRangeAt(0);
  const rootNode =
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentNode
      : range.commonAncestorContainer;

  if (!rootNode) {
    return [getFallbackSelectionBlock(selectedText, range)];
  }

  const blocks = new Map<
    HTMLElement,
    { parts: string[]; style: SelectionBlockStyle; level: SelectionBlockLevel }
  >();

  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text) || !node.textContent?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      if (!range.intersectsNode(node) || !node.parentElement) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode = walker.nextNode();

  while (currentNode) {
    const textNode = currentNode as Text;
    const selectedPortion = normalizeBlockText(
      getSelectedPortionFromTextNode(textNode, range),
    );

    if (selectedPortion) {
      const parentElement = textNode.parentElement;

      if (!parentElement) {
        currentNode = walker.nextNode();
        continue;
      }

      const blockElement = getBlockContainer(parentElement) ?? parentElement;
      const existingBlock = blocks.get(blockElement);

      if (existingBlock) {
        existingBlock.parts.push(selectedPortion);
      } else {
        const style = getBlockStyle(blockElement);
        blocks.set(blockElement, {
          parts: [selectedPortion],
          style,
          level: getBlockLevel(blockElement, style),
        });
      }
    }

    currentNode = walker.nextNode();
  }

  const normalizedBlocks = Array.from(blocks.values())
    .map((block, index) => ({
      id: `block-${index}`,
      text: normalizeBlockText(block.parts.join(" ")),
      level: block.level,
      style: block.style,
    }))
    .filter((block) => block.text);

  return normalizedBlocks.length > 0
    ? normalizedBlocks
    : [getFallbackSelectionBlock(selectedText, range)];
}

export function getCompactBlockStyle(
  style: SelectionBlockStyle,
  level: SelectionBlockLevel,
) {
  const maxFontSize = level === "display" ? 30 : level === "heading" ? 23 : 18;
  const minFontSize = level === "body" ? 15 : 17;
  const fontSize = clamp(style.fontSize * 0.72, minFontSize, maxFontSize);
  const lineHeight = clamp(style.lineHeight * 0.72, fontSize * 1.18, fontSize * 1.6);
  const letterSpacing = clamp(style.letterSpacing * 0.72, -0.6, 1.2);

  return {
    fontSize: `${fontSize}px`,
    fontWeight: Math.min(style.fontWeight, 700),
    fontStyle: style.fontStyle,
    textTransform: style.textTransform,
    letterSpacing: `${letterSpacing}px`,
    lineHeight: `${lineHeight}px`,
    textAlign: style.textAlign,
  };
}

export async function translateSelectionBlocks(
  blocks: SelectionBlock[],
  targetLanguage: ExtensionSettings["targetLanguage"],
) {
  const translatedChunks = await Promise.all(
    blocks.map((block) => translateText(block.text, targetLanguage)),
  );

  return {
    translatedText: translatedChunks.map((chunk) => chunk.translatedText).join("\n\n"),
    detectedLanguage: translatedChunks.find((chunk) => chunk.detectedLanguage)?.detectedLanguage,
    translatedBlocks: blocks.map((block, index) => ({
      ...block,
      text: translatedChunks[index]?.translatedText ?? "",
    })),
  };
}
