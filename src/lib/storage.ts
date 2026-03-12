export type TargetLanguage = "pt" | "en" | "es" | "fr" | "de" | "it" | "ja";

export type ExtensionSettings = {
  enabled: boolean;
  targetLanguage: TargetLanguage;
  disabledSites: string[];
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  targetLanguage: "pt",
  disabledSites: [],
};

const STORAGE_KEY = "traduzir-selecao-settings";

const LANGUAGE_LABELS: Record<string, string> = {
  auto: "Automático",
  pt: "Português",
  en: "Inglês",
  es: "Espanhol",
  fr: "Francês",
  de: "Alemão",
  it: "Italiano",
  ja: "Japonês",
};

export const LANGUAGE_OPTIONS: Array<{ value: TargetLanguage; label: string }> = [
  { value: "pt", label: "Português" },
  { value: "en", label: "Inglês" },
  { value: "es", label: "Espanhol" },
  { value: "fr", label: "Francês" },
  { value: "de", label: "Alemão" },
  { value: "it", label: "Italiano" },
  { value: "ja", label: "Japonês" },
];

export function getLanguageLabel(languageCode?: string) {
  if (!languageCode) {
    return LANGUAGE_LABELS.auto;
  }

  return LANGUAGE_LABELS[languageCode.toLowerCase()] ?? languageCode.toUpperCase();
}

function ensureChromeStorage() {
  if (!chrome?.storage?.sync) {
    throw new Error("Chrome storage indisponivel.");
  }
}

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase();
}

function normalizeSettings(
  settings?: Partial<ExtensionSettings> | null,
): ExtensionSettings {
  const disabledSites = Array.isArray(settings?.disabledSites)
    ? Array.from(
        new Set(
          settings.disabledSites
            .map((site) => normalizeHostname(site))
            .filter(Boolean),
        ),
      )
    : DEFAULT_SETTINGS.disabledSites;

  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    disabledSites,
  };
}

export async function getSettings(): Promise<ExtensionSettings> {
  ensureChromeStorage();

  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return normalizeSettings(result[STORAGE_KEY] as Partial<ExtensionSettings> | undefined);
}

export async function saveSettings(settings: ExtensionSettings) {
  ensureChromeStorage();
  await chrome.storage.sync.set({
    [STORAGE_KEY]: normalizeSettings(settings),
  });
}

export function onSettingsChange(
  callback: (settings: ExtensionSettings) => void,
) {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "sync" || !changes[STORAGE_KEY]?.newValue) {
      return;
    }

    callback(normalizeSettings(changes[STORAGE_KEY].newValue as Partial<ExtensionSettings>));
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
