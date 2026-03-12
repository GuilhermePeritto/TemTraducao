import { TranslationPopup } from "./components/TranslationPopup";
import { useInlineTranslation } from "./useInlineTranslation";

export function InlineTranslationApp({
  container,
}: {
  container: HTMLDivElement;
}) {
  const {
    currentHostname,
    settings,
    tooltipState,
    closeCurrentPopup,
    disableInlineTranslation,
    disableCurrentSite,
  } = useInlineTranslation(container);

  return (
    <TranslationPopup
      state={tooltipState}
      targetLanguage={settings.targetLanguage}
      currentHostname={currentHostname}
      onClose={closeCurrentPopup}
      onDisable={() => {
        void disableInlineTranslation();
      }}
      onDisableSite={() => {
        void disableCurrentSite();
      }}
    />
  );
}
