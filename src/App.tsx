import { useEffect, useMemo, useState } from "react";

import { SettingsPanel } from "@/features/popup/components/SettingsPanel";
import {
  DEFAULT_SETTINGS,
  type ExtensionSettings,
  getSettings,
  saveSettings,
} from "@/lib/storage";

export default function App() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .finally(() => setIsReady(true));
  }, []);

  const statusText = useMemo(() => {
    if (!isReady) {
      return "Carregando preferências...";
    }

    if (settings.disabledSites.length > 0) {
      return `${settings.disabledSites.length} site(s) ignorado(s) pela traducao inline.`;
    }

    return settings.enabled
      ? "A tradução aparece ao selecionar ou dar duplo clique em um texto."
      : "A tradução inline está desabilitada no momento.";
  }, [isReady, settings.disabledSites.length, settings.enabled]);

  async function updateSettings(nextSettings: ExtensionSettings) {
    setSettings(nextSettings);
    await saveSettings(nextSettings);
  }

  return (
    <SettingsPanel
      settings={settings}
      isReady={isReady}
      statusText={statusText}
      onUpdateSettings={updateSettings}
    />
  );
}
