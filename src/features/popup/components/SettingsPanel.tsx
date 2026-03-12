import { Globe2, Languages, ShieldOff, Sparkles, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  LANGUAGE_OPTIONS,
  type ExtensionSettings,
} from "@/lib/storage";

function LoadingSkeleton() {
  return (
    <div>
      <div className="border-b border-white/10 px-5 pb-5 pt-5">
        <div className="flex items-start gap-4">
          <div className="glass-skeleton h-14 w-14 rounded-[18px] border border-white/5" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="glass-skeleton h-7 w-40 rounded-xl" />
            <div className="glass-skeleton h-4 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="space-y-0">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="glass-skeleton h-6 w-40 rounded-lg" />
          <div className="glass-skeleton mt-4 h-11 w-20 rounded-full" />
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <div className="glass-skeleton mb-3 h-4 w-28 rounded-lg" />
          <div className="glass-skeleton h-11 w-full rounded-[14px] border border-white/5" />
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <div className="glass-skeleton mb-3 h-4 w-24 rounded-lg" />
          <div className="glass-skeleton h-11 w-full rounded-[14px] border border-white/5" />
        </div>

        <div className="px-5 py-4">
          <div className="glass-skeleton mb-2 h-3.5 w-32 rounded-lg" />
          <div className="glass-skeleton h-4 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-b border-white/10 px-5 py-4 last:border-b-0 ${className}`}>
      {children}
    </section>
  );
}

function FieldSurface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[16px] border border-white/10 bg-black/20 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SettingsPanel({
  settings,
  isReady,
  statusText,
  onUpdateSettings,
}: {
  settings: ExtensionSettings;
  isReady: boolean;
  statusText: string;
  onUpdateSettings: (nextSettings: ExtensionSettings) => Promise<void>;
}) {
  return (
    <main className="w-[372px] max-w-full bg-[radial-gradient(circle_at_top,rgba(64,124,255,0.14),transparent_32%),linear-gradient(180deg,#07090d_0%,#0b0f16_100%)] p-2.5 text-white">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(64,124,255,0.18),transparent_32%),linear-gradient(180deg,#0a0c10_0%,#101319_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl">
        {!isReady ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="border-b border-white/10 px-5 pb-5 pt-5">
              <div className="flex items-start gap-4">
                <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(67,107,255,0.26),rgba(67,107,255,0.14))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <Globe2 className="h-7 w-7 text-blue-200" />
                </div>
                <div className="space-y-1 pt-1">
                  <p className="text-[28px] font-semibold tracking-[-0.04em]">
                    TemTradução
                  </p>
                  <p className="text-[15px] text-white/55">Configurações</p>
                </div>
              </div>
            </div>

            <div>
              <Section>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[15px] font-medium text-white">
                      Ativar tradução
                    </div>
                    <p className="text-xs leading-5 text-white/55">
                      Mostra o popup ao selecionar texto ou dar duplo clique.
                    </p>
                  </div>

                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(enabled) =>
                      onUpdateSettings({ ...settings, enabled })
                    }
                    aria-label="Ativar tradução"
                  />
                </div>
              </Section>

              <Section>
                <div className="mb-2 text-sm font-medium text-white/70">
                  Idioma de origem
                </div>
                <FieldSurface className="flex min-h-11 items-center gap-2 text-[15px] text-white/80">
                  <Globe2 className="h-4 w-4 text-white/45" />
                  Detectar automaticamente
                </FieldSurface>
              </Section>

              <Section>
                <div className="mb-3 flex items-center gap-2 text-sm text-white/80">
                  <Languages className="h-4 w-4 text-white/60" />
                  Traduzir para
                </div>
                <Select
                  value={settings.targetLanguage}
                  onValueChange={(targetLanguage) =>
                    onUpdateSettings({
                      ...settings,
                      targetLanguage: targetLanguage as ExtensionSettings["targetLanguage"],
                    })
                  }
                >
                  <SelectTrigger className="h-11 rounded-[16px] border-white/10 bg-black/20 text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-white/[0.06]">
                    <SelectValue placeholder="Escolha um idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Section>

              {settings.disabledSites.length > 0 ? (
                <Section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <ShieldOff className="h-4 w-4 text-white/60" />
                      Sites ignorados
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...settings, disabledSites: [] })
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65 transition hover:bg-white/10 hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Limpar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {settings.disabledSites.slice(0, 3).map((site) => (
                      <FieldSurface key={site} className="truncate px-3 py-2 text-xs text-white/62">
                        {site}
                      </FieldSurface>
                    ))}
                    {settings.disabledSites.length > 3 ? (
                      <p className="text-xs text-white/45">
                        +{settings.disabledSites.length - 3} site(s) adicional(is)
                      </p>
                    ) : null}
                  </div>
                </Section>
              ) : null}

              <Section className="pb-5">
              <div className="rounded-[18px] bg-white/[0.02] p-0">
                <p className="mb-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40">
                  <Sparkles className="h-3.5 w-3.5" />
                  Status
                </p>
                <p className="text-sm leading-6 text-white/68">{statusText}</p>
              </div>
              </Section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
