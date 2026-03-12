export type TranslationResult = {
  translatedText: string;
  detectedLanguage?: string;
};

export type SynonymResult = {
  synonyms: string[];
  source: "selected" | "translated";
};

function normalizeTranslationResponse(data: unknown): TranslationResult {
  const translationChunks = Array.isArray(data) ? data[0] : null;
  const detectedLanguage =
    Array.isArray(data) && typeof data[2] === "string" ? data[2] : undefined;

  const translatedText = Array.isArray(translationChunks)
    ? translationChunks
        .map((chunk) =>
          Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : "",
        )
        .join("")
        .trim()
    : "";

  if (!translatedText) {
    throw new Error("Nao foi possivel traduzir o texto selecionado.");
  }

  return {
    translatedText,
    detectedLanguage,
  };
}

export async function translateText(text: string, targetLanguage: string) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Nenhum texto foi selecionado.");
  }

  const query = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: targetLanguage,
    dt: "t",
    q: trimmedText,
  });

  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${query.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Falha ao consultar o Google Tradutor.");
  }

  const data = (await response.json()) as unknown;
  return normalizeTranslationResponse(data);
}

export function isSingleWordSelection(text: string) {
  const normalizedText = text
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()"!?[\]]/g, " ");

  const words = normalizedText.split(/\s+/).filter(Boolean);
  return words.length === 1;
}

function normalizeWord(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function canRequestEnglishSynonyms(word: string) {
  return /^[a-zA-Z-]+$/.test(word);
}

function dedupeWords(words: string[]) {
  return Array.from(new Set(words.map((word) => word.trim()).filter(Boolean)));
}

export async function fetchSynonyms(params: {
  selectedText: string;
  translatedText: string;
  detectedLanguage?: string;
  targetLanguage: string;
}): Promise<SynonymResult | null> {
  const selectedWord = normalizeWord(params.selectedText);
  const translatedWord = normalizeWord(params.translatedText);

  let queryWord = "";
  let source: SynonymResult["source"] = "selected";

  if (params.detectedLanguage === "en" && canRequestEnglishSynonyms(selectedWord)) {
    queryWord = selectedWord;
    source = "selected";
  } else if (
    params.targetLanguage === "en" &&
    canRequestEnglishSynonyms(translatedWord)
  ) {
    queryWord = translatedWord;
    source = "translated";
  } else if (canRequestEnglishSynonyms(selectedWord)) {
    queryWord = selectedWord;
    source = "selected";
  } else if (canRequestEnglishSynonyms(translatedWord)) {
    queryWord = translatedWord;
    source = "translated";
  } else {
    return null;
  }

  const response = await fetch(
    `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(queryWord)}&max=6`,
  );

  if (!response.ok) {
    throw new Error("Falha ao buscar sinonimos.");
  }

  const data = (await response.json()) as Array<{ word?: string }>;
  const synonyms = data
    .map((item) => item.word?.trim())
    .filter((word): word is string => Boolean(word && word !== queryWord))
    .slice(0, 6);

  if (synonyms.length === 0) {
    return null;
  }

  const localizedSynonyms =
    params.targetLanguage === "en"
      ? synonyms
      : await Promise.all(
          synonyms.map(async (synonym) => {
            try {
              const result = await translateText(synonym, params.targetLanguage);
              return result.translatedText;
            } catch {
              return synonym;
            }
          }),
        );

  return {
    synonyms: dedupeWords(localizedSynonyms).slice(0, 6),
    source,
  };
}
