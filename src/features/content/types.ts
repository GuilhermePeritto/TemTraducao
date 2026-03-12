export type AnchorRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

export type TooltipPlacement = "bottom" | "top" | "right" | "left";

export type SelectionBlockLevel = "display" | "heading" | "body";

export type SelectionBlockStyle = {
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  textTransform: string;
  letterSpacing: number;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
};

export type SelectionBlock = {
  id: string;
  text: string;
  level: SelectionBlockLevel;
  style: SelectionBlockStyle;
};

export type TooltipState = {
  open: boolean;
  selectionSignature: string;
  selectedText: string;
  selectedBlocks: SelectionBlock[];
  translatedText: string;
  translatedBlocks: SelectionBlock[];
  detectedLanguage?: string;
  isLoading: boolean;
  isLoadingSynonyms: boolean;
  synonyms: string[];
  synonymsSource?: "selected" | "translated";
  error?: string;
  anchorRect: AnchorRect;
};

export const INITIAL_TOOLTIP_STATE: TooltipState = {
  open: false,
  selectionSignature: "",
  selectedText: "",
  selectedBlocks: [],
  translatedText: "",
  translatedBlocks: [],
  detectedLanguage: undefined,
  isLoading: false,
  isLoadingSynonyms: false,
  synonyms: [],
  synonymsSource: undefined,
  error: undefined,
  anchorRect: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};
